import { randomBytes } from "crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { Service } from "typedi";
import { EntityId } from "redis-om";
import { IUser } from "../../models/user";
import ValidationError from "../../helpers/validation_error";
import { UserRepository } from "../../schemas/redis/user";
import { ITokenToGenerate, generateTokenNew } from "../../helpers/generate_token";
import { sendEmail } from "../../helpers/utils/send_email";
import { ResetTokenRepository } from "../../schemas/redis/reset_password_token";
import { ClientRepository } from "../../schemas/redis/client";
import moment from "moment";
import { OTPRepository } from "../../schemas/redis/reset_password_otp";
import { redisClient } from "../../integration/redis/redis";

interface IUserWithTokenResponse {
  user: {
    entity_id: string;
    name: string;
    surname: string;
    email: string;
    // Not advised to return more here - rather let the FE call the get(user_entity_id) method below.
  };
  token: string;
}

@Service()
export class UserService3 {
  public async signUp(user: IUser): Promise<IUserWithTokenResponse> {
    const existingUser = await UserRepository.search() //
      .where("client_entity_id")
      .eq(user.client_entity_id)
      .and("email")
      .eq(user.email)
      .and("role")
      .eq("user")
      .return.all();

    if (existingUser && existingUser.length > 0) {
      throw new ValidationError(`You already have an existing account.`);
    }

    const salt = randomBytes(32);
    const hashedPassword = await argon2.hash(user.password, {
      salt: salt,
    });

    const u: IUser = {
      ...user,
      role: "user",
      salt: salt.toString("hex"),
      password: hashedPassword,
      created_at: moment().tz("Africa/Johannesburg").unix(),
    };

    const userRepo = await UserRepository.save(u);
    const entityId = userRepo[EntityId];

    const token = await generateTokenNew({
      entity_id: entityId,
      email: user.email,
      name: user.name,
      role: "user",
    });

    return {
      user: {
        entity_id: entityId,
        name: user.name,
        surname: user.surname,
        email: user.email,
      },
      token: token,
    };
  }

  public async create(user: IUser): Promise<any> {
    const existingUser = await UserRepository.search() //
      .where("client_entity_id")
      .eq(user.client_entity_id)
      .and("email")
      .eq(user.email)
      .return.all();

    if (existingUser && existingUser.length > 0) {
      throw new ValidationError(`User already exists.`);
    }

    const randomSalt = randomBytes(32);
    const sixDigitPass = Math.floor(100000 + Math.random() * 900000); // 6 digit random number
    const hashedPassword = await argon2.hash(sixDigitPass.toString(), {
      salt: randomSalt,
    });

    const u: IUser = {
      ...user,
      role: "user",
      salt: randomSalt.toString("hex"),
      password: hashedPassword,
      created_at: moment().tz("Africa/Johannesburg").unix(),
    };

    const userRepo = await UserRepository.save(u);
    const entityId = userRepo[EntityId];

    // return everything but exclude the salt and password

    const { salt, password, ...rest } = userRepo;

    return {
      ...rest,
      entity_id: entityId,
      naked_password: sixDigitPass.toString(),
    };
  }

  public async update(user_entity_id: string, entity: IUser): Promise<any> {
    const existingUser = await UserRepository.fetch(user_entity_id);

    if (!existingUser) {
      throw new ValidationError(`Could not find user to update.`);
    }

    console.log("existingUser", existingUser);
    console.log("entity", entity);

    const updatedUser = await UserRepository.save(user_entity_id, {
      ...existingUser,
      ...entity,
      updated_at: moment().tz("Africa/Johannesburg").unix(),
    });

    delete updatedUser.password;
    delete updatedUser.salt;

    // return { ...updatedUser, entity_id: existingUser[EntityId] };

    const token = await generateTokenNew({
      entity_id: existingUser[EntityId],
      email: updatedUser.email.toString(),
      name: updatedUser.name.toString(),
      role: "user",
    });

    return {
      user: {
        // Note this returns the whole user object, but without the password and salt.
        ...updatedUser,
        entity_id: existingUser[EntityId],
      },
      token: token,
    };
  }

  public async logIn(email: string, password: string, client_entity_id: string): Promise<IUserWithTokenResponse> {
    const existingUser = await UserRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .and("email")
      .eq(email)
      .return.first();

    if (!existingUser) {
      throw new ValidationError(`User does not exist.`);
    }

    const validPassword = await argon2.verify(existingUser.password.toString(), password);

    if (validPassword) {
      // update last login date
      await UserRepository.save(existingUser[EntityId], {
        ...existingUser,
        last_login: moment().tz("Africa/Johannesburg").unix(),
      });

      const token = await generateTokenNew({
        entity_id: existingUser[EntityId],
        email: existingUser.email.toString(),
        name: existingUser.name.toString(),
        role: "user",
      });

      return {
        user: {
          entity_id: existingUser[EntityId],
          name: existingUser.name.toString(),
          surname: existingUser.surname.toString(),
          email: existingUser.email.toString(),
        },
        token: token,
      };
    } else {
      throw new ValidationError(`Invalid credentials.`);
    }
  }

  public async get(user_entity_id: string): Promise<any> {
    const user = await UserRepository.fetch(user_entity_id);

    if (user) {
      const { password, salt, ...rest } = user;
      return { ...rest, entity_id: user[EntityId] };
    } else {
      throw new ValidationError(`Could not find user by entity id.`);
    }
  }

  public async usersForClient(client_entity_id: string) {
    const foundUsers = await UserRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .return.all();

    // new array where we dont return the password and salt
    const users = foundUsers.map((u) => {
      const { password, salt, ...rest } = u;
      return { ...rest, entity_id: u[EntityId] };
    });

    return users;
  }

  public async delete(user_entity_id: string) {
    const user = await UserRepository.fetch(user_entity_id);

    if (user.client_entity_id) {
      await UserRepository.remove(user_entity_id);
      return true;
    } else {
      throw new ValidationError(`Could not find user to delete.`);
    }
  }

  async forgotEmailPassword(email: string): Promise<any> {
    const user = await UserRepository.search() //
      .where("email")
      .eq(email)
      .return.first();
    if (!user?.client_entity_id) {
      throw new Error("User not found.");
    }

    const client = await ClientRepository.fetch(user.client_entity_id.toString());
    if (!client.name) {
      throw new Error("Could not find the user's client.");
    }

    const token = jwt.sign(
      { user_entity_id: user[EntityId], role: user.role },
      process.env.JWT_SECRET ?? "", //
      { expiresIn: `15m` },
    );

    const resetToken = await ResetTokenRepository.save({ reset_token: token, user_entity_id: user[EntityId] });
    ResetTokenRepository.expire(resetToken[EntityId], 900); // 900 seconds = 15 minutes

    const resetPasswordLink = `${process.env.WEBSITE_URL}/#/reset_password/${encodeURIComponent(resetToken.reset_token.toString())}`;
    console.log("resetPasswordLink", resetPasswordLink);

    try {
      await sendEmail({
        to: user.email.toString().trim(),
        subject: "Reset Password",
        body: `
          Hi ${user.name.toString().trim()},
          <br/>
          You have requested to reset your password.
          <br/>
          If you did not request this, please ignore this email.
          <br/>
          <br/>
          In order to reset your password, please click the link below:
          <br/>
          <a href="${resetPasswordLink}">${resetPasswordLink}</a>
          <br/>
          <br/>
          If the link does not work, please copy and paste it into your browser.
          <br/>
          <br/>
          Regards,
          <br/>
          ${client.name}
        `,
      });

      return "The reset password email has been sent.";
    } catch (error) {
      console.log("error", error);
      throw new Error("The reset password email could not be sent.");
    }
  }

  async changeForgotPassword(userId: string, newPassword: string, resetToken: string): Promise<IUserWithTokenResponse> {
    const user = await UserRepository.fetch(userId);

    if (!user.client_entity_id) {
      throw new ValidationError("User not found.");
    }

    // This automatically expires after 15 minutes, at time of writing.
    const records = await ResetTokenRepository.search() //
      .where("user_entity_id")
      .eq(userId)
      .and("reset_token")
      .eq(resetToken)
      .return.all();

    if (records) {
      const salt = randomBytes(32);
      const hashedPassword = await argon2.hash(newPassword, { salt });
      user.salt = salt.toString("hex");
      user.password = hashedPassword;
      // await userRecord.save();
      await UserRepository.save(userId, user);

      // const token = await generateToken(userObj);
      const token = await generateTokenNew({
        entity_id: user[EntityId],
        email: user.email.toString(),
        name: user.name.toString(),
        role: user.role.toString(),
      });

      // Delete all reset tokens for this user.
      for (const record of records) {
        await ResetTokenRepository.remove(record[EntityId]);
      }

      return {
        user: {
          entity_id: user[EntityId],
          name: user.name.toString(),
          surname: user.surname.toString(),
          email: user.email.toString(),
        },
        token: token,
      };
    } else {
      throw new ValidationError("Reset token not found, has already been used, or has expired.");
    }
  }

  async changePassword(decodedToken: ITokenToGenerate, newPassword: string): Promise<IUserWithTokenResponse> {
    const user = await UserRepository.fetch(decodedToken.entity_id);
    if (!user.client_entity_id) {
      throw new ValidationError("User not found.");
    }

    const salt = randomBytes(32);
    const hashedPassword = await argon2.hash(newPassword, { salt });
    user.salt = salt.toString("hex");
    user.password = hashedPassword;

    await UserRepository.save(user[EntityId], user);

    const token = await generateTokenNew({
      entity_id: user[EntityId],
      email: user.email.toString(),
      name: user.name.toString(),
      role: user.role.toString(),
    });

    return {
      user: {
        entity_id: user[EntityId],
        name: user.name.toString(),
        surname: user.surname.toString(),
        email: user.email.toString(),
      },
      token: token,
    };
  }

  async forgotEmailPasswordOtp(email: string): Promise<any> {
    const user = await UserRepository.search() //
      .where("email")
      .eq(email)
      .return.first();
    if (!user?.client_entity_id) {
      throw new Error("User not found.");
    }

    const client = await ClientRepository.fetch(user.client_entity_id.toString());
    if (!client.name) {
      throw new Error("Could not find the user's client.");
    }

    // 6 digit otp
    const otp = Math.floor(100000 + Math.random() * 900000);

    const otpRecord = await OTPRepository.save({ otp: otp.toString(), user_entity_id: user[EntityId] });
    OTPRepository.expire(otpRecord[EntityId], 900); // 900 seconds = 15 minutes

    try {
      await sendEmail({
        to: user.email.toString().trim(),
        subject: "Reset Password",
        body: `
          Hi ${user.name.toString().trim()},
          <br/>
          You have requested to reset your password.
          <br/>
          If you did not request this, please ignore this email.
          <br/>
          <br/>
          To reset your password, use this OTP - its only valid for 15 minutes:
          <br/>
          ${otp}
          <br/>
          <br/>
          Regards,
          <br/>
          ${client.name}
        `,
      });

      return "The reset password OTP email has been sent.";
    } catch (error) {
      console.log("error", error);
      throw new Error("The reset password OTP email could not be sent.");
    }
  }

  async changeForgotPasswordOtp(email: string, new_password: string, otp: string): Promise<IUserWithTokenResponse> {
    const user = await UserRepository.search() //
      .where("email")
      .eq(email)
      .return.first();
    if (!user.client_entity_id) {
      throw new Error("User not found.");
    }

    console.log("email", email);
    console.log("new_password", new_password);
    console.log("otp", otp);
    const otpRecord = await OTPRepository.search() //
      .where("user_entity_id")
      .eq(user[EntityId])
      .and("otp")
      .eq(otp)
      .return.first();

    console.log("otpRecord", otpRecord);
    if (otpRecord) {
      const salt = randomBytes(32);
      const hashedPassword = await argon2.hash(new_password, { salt });
      user.salt = salt.toString("hex");
      user.password = hashedPassword;
      await UserRepository.save(user[EntityId], user);

      // const token = await generateToken(userObj);
      const token = await generateTokenNew({
        entity_id: user[EntityId],
        email: user.email.toString(),
        name: user.name.toString(),
        role: user.role.toString(),
      });

      // Delete the otp record.
      await OTPRepository.remove(otpRecord[EntityId]);

      return {
        user: {
          entity_id: user[EntityId],
          name: user.name.toString(),
          surname: user.surname.toString(),
          email: user.email.toString(),
        },
        token: token,
      };
    } else {
      throw new ValidationError("OTP not found, has already been used, or has expired.");
    }
  }

  async deactivateAccount(user_entity_id: string, decoded_token: any): Promise<boolean> {
    const { entity_id } = decoded_token;
    if (user_entity_id !== entity_id) {
      throw new ValidationError("You are not authorized to deactivate this account.");
    }

    const user = await UserRepository.fetch(user_entity_id);
    if (!user.client_entity_id) {
      throw new ValidationError("User not found.");
    }

    // add to deacticcation repository
    // then delete user
    const multi = redisClient.multi();

    multi.json.del(`USER:${user_entity_id}`);
    // preserve the user key (entity_id) in the deactivated user's list
    multi.json.set(`DEACTIVATEDUSERS:${user[EntityId]}`, "$", {
      ...user,
      deactivated_at: moment().tz("Africa/Johannesburg").unix(),
    });

    multi.exec();

    return true;
  }

  async reactivateAccount(user_entity_id: string): Promise<boolean> {
    const deactivatedUser: any = await redisClient.json.get(`DEACTIVATEDUSERS:${user_entity_id}`);

    if (!deactivatedUser.client_entity_id) {
      throw new ValidationError("Could not find user to reactivate.");
    }

    const multi = redisClient.multi();

    multi.json.del(`DEACTIVATEDUSERS:${user_entity_id}`);
    multi.json.set(`USER:${user_entity_id}`, "$", {
      ...deactivatedUser,
      reactivated_at: moment().tz("Africa/Johannesburg").unix(),
    });

    multi.exec();

    return true;
  }

  async adminAutoGenUserPassword(user_entity_id: string): Promise<string> {
    const user = await UserRepository.fetch(user_entity_id);

    if (!user.client_entity_id) {
      throw new ValidationError("User not found.");
    }

    const generatedPass = Math.random().toString(36).slice(-6); // 6 digit random string

    const salt = randomBytes(32);
    const hashedPassword = await argon2.hash(generatedPass, { salt });
    user.salt = salt.toString("hex");
    user.password = hashedPassword;

    await UserRepository.save(user_entity_id, user);

    return generatedPass;
  }
}
