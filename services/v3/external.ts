import { randomBytes } from "crypto";
import argon2 from "@node-rs/argon2";
import { Service } from "typedi";
import { ClientRepository } from "../../schemas/redis/client";
import { UserRepository } from "../../schemas/redis/user";
import moment from "moment-timezone";
import { ApiCredentialRepository } from "../../schemas/redis/api_credentials";
import { sendEmail } from "../../helpers/utils/send_email";
import { EntityId } from "redis-om";
import { IApiCredentials } from "../../models/api_credentials";
import { BidderRepository } from "../../schemas/redis/bidder";
import ValidationError from "../../helpers/validation_error";
import { Container } from "typedi";
import { BidderService3 } from "./bidder";
import { FileService3 } from "./file";

@Service()
export class ExternalService3 {
  public async create_user(decoded_api_credentials: IApiCredentials, user: any): Promise<any> {
    const { api_key } = decoded_api_credentials;

    const existingApiCredential = await ApiCredentialRepository.search() //
      .where("api_key")
      .eq(api_key)
      .return.first();

    if (!existingApiCredential) {
      throw new Error(`The API token provided is invalid, or has been revoked.`);
    }

    const client = await ClientRepository.fetch(existingApiCredential.client_entity_id.toString());

    if (!client.name) {
      throw new Error(`Client was not found. User creation aborted.`);
    }

    const existingUser = await UserRepository.search() //
      .where("email")
      .eq(user.email)
      .return.first();

    if (existingUser) {
      throw new Error(`User with this email address already exists.`);
    }

    // 6 digit password string
    const tempPassword = Math.random().toString(36).slice(-6);
    console.log(tempPassword, "tempPasswordtempPassword");
    await sendEmail({
      to: user.email.toString().trim(),
      subject: "Account Created",
      body: `
        Hi ${user.name.toString().trim()},
        <br/>
        Welcome to ${client.name}! An account has been created for you.
        <br/>
        Download the ${client.name} app from the app store, or go to our website and log in with the following credentials:
        <br/>
        <br/>
        Username: ${user.email}
        <br/>
        Password: ${tempPassword}
        <br/>
        <br/>
        Regards,
        <br/>
        ${client.name}
      `,
    });

    const salt = randomBytes(32);
    const hashedPassword = await argon2.hash(tempPassword, {
      salt: salt,
    });

    const newUser = await UserRepository.save({
      ...user,
      client_entity_id: existingApiCredential.client_entity_id,
      salt: salt.toString("hex"),
      password: hashedPassword,
      created_at: moment().tz("Africa/Johannesburg").unix(),
      // external: true, // indicates that this user was created from an external source
    });

    return {
      user_entity_id: newUser[EntityId as any],
    };
  }

  public async register_user(decoded_api_credentials: IApiCredentials, user_entity_id: string): Promise<any> {
    const { api_key } = decoded_api_credentials;

    const existingApiCredential = await ApiCredentialRepository.search() //
      .where("api_key")
      .eq(api_key)
      .return.first();

    if (!existingApiCredential) {
      throw new Error(`The API token provided is invalid, or has been revoked.`);
    }

    const existingUser = await UserRepository.fetch(user_entity_id);
    if (!existingUser.client_entity_id) {
      throw new Error(`User not found.`);
    }

    const existingBidder = await BidderRepository.search() //
      .where("client_entity_id")
      .eq(existingUser.client_entity_id.toString())
      .and("user_entity_id")
      .eq(existingUser[EntityId as any])
      .return.first();
    if (existingBidder?.client_entity_id) {
      throw new ValidationError(`This user has already been registered as a bidder!`);
    }

    const bidder: any = {
      client_entity_id: existingUser.client_entity_id,
      user_entity_id: existingUser[EntityId as any],
      is_verified: false,
      paddle_number: "<unset>",
      created_at: moment().tz("Africa/Johannesburg").unix(),
    };

    const bidderService = Container.get(BidderService3);
    bidder.paddle_number = await bidderService.generatePaddleNumber({
      client_entity_id: existingUser.client_entity_id.toString(),
    });

    // TODO: RIGHT HERE, we still have the possibility of a paddle_number collision.
    //       Redis just makes it less likely because of its speed.

    const savedBidder = await BidderRepository.save(bidder);

    const obr = {
      // ...savedBidder,
      bidder_entity_id: savedBidder[EntityId as any],
      is_verified: savedBidder.is_verified,
      paddle_number: savedBidder.paddle_number,
    };

    return obr;
  }

  public async bidder_status(decoded_api_credentials: IApiCredentials, user_entity_id: string): Promise<any> {
    const { api_key } = decoded_api_credentials;

    const existingApiCredential = await ApiCredentialRepository.search() //
      .where("api_key")
      .eq(api_key)
      .return.first();
    if (!existingApiCredential) {
      throw new Error(`The API token provided is invalid, or has been revoked.`);
    }

    const user = await UserRepository.fetch(user_entity_id);
    if (!user.client_entity_id) {
      throw new Error(`User not found.`);
    }

    const bidderService = Container.get(BidderService3);
    const statusResponse = await bidderService.status({ client_entity_id: existingApiCredential.client_entity_id.toString(), user_entity_id });
    return {
      ...statusResponse,
      bidder: {
        paddle_number: statusResponse.bidder.paddle_number,
        bidder_entity_id: statusResponse.bidder.entity_id,
      },
    };
  }

  public async upload_proof_of_id(decoded_api_credentials: IApiCredentials, bidder_entity_id: string, files: any): Promise<any> {
    const { api_key } = decoded_api_credentials;

    const existingApiCredential = await ApiCredentialRepository.search() //
      .where("api_key")
      .eq(api_key)
      .return.first();
    if (!existingApiCredential) {
      throw new Error(`The API token provided is invalid, or has been revoked.`);
    }

    const bidder = await BidderRepository.fetch(bidder_entity_id);
    if (!bidder.client_entity_id) {
      throw new Error(`Bidder not found.`);
    }

    const fileService = Container.get(FileService3);
    const resp: any = await fileService.upload(
      {
        bidder_entity_id: bidder_entity_id,
        custom_name: "proof_of_id",
        type: "Document",
      },
      files,
    );

    return {
      file_entity_id: resp.entity_id,
      file_name: resp.file_name,
      file_extension: resp.file_extension,
      uploaded_file_url: resp.uploaded_file_url,
      bidder_entity_id: resp.bidder_entity_id,
    };
  }

  public async upload_proof_of_address(decoded_api_credentials: IApiCredentials, bidder_entity_id: string, files: any): Promise<any> {
    const { api_key } = decoded_api_credentials;

    const existingApiCredential = await ApiCredentialRepository.search() //
      .where("api_key")
      .eq(api_key)
      .return.first();
    if (!existingApiCredential) {
      throw new Error(`The API token provided is invalid, or has been revoked.`);
    }

    const bidder = await BidderRepository.fetch(bidder_entity_id);
    if (!bidder.client_entity_id) {
      throw new Error(`Bidder not found.`);
    }

    const fileService = Container.get(FileService3);
    const resp: any = await fileService.upload(
      {
        bidder_entity_id: bidder_entity_id,
        custom_name: "proof_of_address",
        type: "Document",
      },
      files,
    );

    return {
      file_entity_id: resp.entity_id,
      file_name: resp.file_name,
      file_extension: resp.file_extension,
      uploaded_file_url: resp.uploaded_file_url,
      bidder_entity_id: resp.bidder_entity_id,
    };
  }

  public async verifyBidder(decoded_api_credentials: IApiCredentials, bidder_entity_id: string, verified: boolean): Promise<any> {
    const { api_key } = decoded_api_credentials;

    const existingApiCredential = await ApiCredentialRepository.search() //
      .where("api_key")
      .eq(api_key)
      .return.first();
    if (!existingApiCredential) {
      throw new Error(`The API token provided is invalid, or has been revoked.`);
    }

    const bidderService = Container.get(BidderService3);
    const response: any = await bidderService.verification(bidder_entity_id, verified);

    return {
      bidder_entity_id: response.entity_id,
      user_entity_id: response.user_entity_id,
      is_verified: response.is_verified,
      paddle_number: response.paddle_number,
    };
  }
}
