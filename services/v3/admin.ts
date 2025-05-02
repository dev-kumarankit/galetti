import { randomBytes } from "crypto";
import argon2 from "argon2";
import { Service } from "typedi";
import { EntityId } from "redis-om";
import ValidationError from "../../helpers/validation_error";
import { ITokenToGenerate, generateTokenNew } from "../../helpers/generate_token";
import { IAdmin } from "../../models/admin";
import { AdminRepository } from "../../schemas/redis/admin";
import { ClientRepository } from "../../schemas/redis/client";

@Service()
export class AdminService3 {
  public async create(admin: IAdmin): Promise<any> {
    const existingUser = await AdminRepository.search() //
      .where("email")
      .eq(admin.email)
      .return.all();

    if (existingUser && existingUser.length > 0) {
      throw new ValidationError(`You already have an existing admin account.`);
    }

    if (admin.role === "admin") {
      // we need to check if the client_entity_id exists
      const existingClient = await ClientRepository.fetch(admin.client_entity_id);

      if (!existingClient?.name) {
        throw new ValidationError(`Specified client does not exist.`);
      }
    }

    const salt = randomBytes(32);
    const hashedPassword = await argon2.hash(admin.password, {
      salt: salt,
    });

    const adminToCreate: IAdmin = {
      ...admin,
      password: hashedPassword,
    };

    const userRepo = await AdminRepository.save(adminToCreate);
    const entityId = userRepo[EntityId];

    const token = await generateTokenNew({
      entity_id: entityId,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const adminObj: any = {
      entity_id: entityId,
      name: admin.name,
      surname: admin.surname,
      email: admin.email,
      role: admin.role,
    };

    if (admin.role === "admin") {
      adminObj.client_entity_id = admin.client_entity_id;
    }

    return {
      admin: adminObj,
      token: token,
    };
  }

  public async logIn(email: string, password: string): Promise<any> {
    const existingUser = await AdminRepository.search() //
      .where("email")
      .eq(email)
      .return.first();

    if (existingUser) {
      const validPassword = await argon2.verify(existingUser.password.toString(), password);

      if (validPassword) {
        const token = await generateTokenNew({
          entity_id: existingUser[EntityId],
          email: existingUser.email.toString(),
          name: existingUser.name.toString(),
          role: existingUser.role.toString(),
        });

        const adminObj: any = {
          entity_id: existingUser[EntityId],
          name: existingUser.name.toString(),
          surname: existingUser.surname.toString(),
          email: existingUser.email.toString(),
          role: existingUser.role.toString(),
        };

        if (existingUser.role === "admin") {
          adminObj.client_entity_id = existingUser.client_entity_id.toString();
        }

        return {
          admin: adminObj,
          token: token,
        };
      } else {
        throw new ValidationError(`Invalid credentials.`);
      }
    } else {
      throw new ValidationError(`Admin user does not exist.`);
    }
  }

  async changePassword(decodedToken: ITokenToGenerate, new_password: string): Promise<any> {
    const adminUser = await AdminRepository.fetch(decodedToken.entity_id);
    if (!adminUser.role) {
      throw new ValidationError("Admin user not found.");
    }

    const salt = randomBytes(32);
    const hashedPassword = await argon2.hash(new_password, { salt });
    adminUser.salt = salt.toString("hex");
    adminUser.password = hashedPassword;

    await AdminRepository.save(adminUser[EntityId], adminUser);

    const token = await generateTokenNew({
      entity_id: adminUser[EntityId],
      email: adminUser.email.toString(),
      name: adminUser.name.toString(),
      role: adminUser.role.toString(),
    });

    const adminObj: any = {
      entity_id: adminUser[EntityId],
      name: adminUser.name.toString(),
      surname: adminUser.surname.toString(),
      email: adminUser.email.toString(),
      role: adminUser.role.toString(),
    };

    if (adminUser.role === "admin") {
      adminObj.client_entity_id = adminUser.client_entity_id.toString();
    }

    return {
      admin: adminObj,
      token: token,
    };
  }

  async delete(entity_id: string) {
    // check that this is not a super_admin
    const admin = await AdminRepository.fetch(entity_id);

    if (!admin.role) {
      throw new ValidationError("Admin user not found.");
    }

    if (admin.role === "super_admin") {
      throw new ValidationError("Cannot delete super_admin. Please contact the developers to get super_admin users deleted!");
    }

    await AdminRepository.remove(entity_id);

    return true;
  }

  async adminsForClient(client_entity_id: string): Promise<any> {
    const client = await ClientRepository.fetch(client_entity_id);

    if (!client.name) {
      throw new ValidationError("Client not found.");
    }

    const admins = await AdminRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .and("role")
      .eq("admin") // exclude super_admins
      .return.all();

    return admins.map((admin) => {
      return {
        entity_id: admin[EntityId],
        name: admin.name.toString(),
        surname: admin.surname.toString(),
        email: admin.email.toString(),
        role: admin.role.toString(),
        client_entity_id: admin.client_entity_id.toString(),
      };
    });
  }
}
