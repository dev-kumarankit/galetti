import { Service } from "typedi";
import { EntityId } from "redis-om";
import ValidationError from "../../helpers/validation_error";
import { IClient } from "../../models/client";
import { ClientRepository } from "../../schemas/redis/client";
import { generateClientToken } from "../../helpers/generate_token";
import moment from "moment-timezone";
import jwt from "jsonwebtoken";
import { generateApiKey, generateApiSecret } from "../../helpers/generate_api_credentials";
import { ApiCredentialRepository } from "../../schemas/redis/api_credentials";
import { UserRepository } from "../../schemas/redis/user";
import { sendEmail } from "../../helpers/utils/send_email";
import { SocialMediaRepository } from "../../schemas/redis/social_media";
import { ConfigurationCollection } from "../../schemas/mongo/configuration";

@Service()
export class ClientService3 {
  public async create(client: IClient) {
    const existingClient = await ClientRepository.search() //
      .where("name")
      .eq(client.name)
      .return.first();

    if (existingClient && existingClient.name) {
      throw new ValidationError(`Client already exists.`);
    }

    client.created_at = moment().tz("Africa/Johannesburg").unix();

    const newClient = await ClientRepository.save(client);

    newClient.token = await generateClientToken({
      entity_id: newClient[EntityId],
      name: client.name,
    });

    await ClientRepository.save(newClient);

    return {
      ...newClient,
      entity_id: newClient[EntityId],
    };
  }

  public async update(client_entity_id: string, client: IClient) {
    const existingClient = await ClientRepository.fetch(client_entity_id);

    if (!existingClient.name) {
      throw new ValidationError(`Client not found.`);
    }

    const updatedClient = await ClientRepository.save(client_entity_id, {
      ...existingClient,
      ...client,
      updated_at: moment().tz("Africa/Johannesburg").unix(),
    });

    return {
      ...updatedClient,
      entity_id: updatedClient[EntityId],
    };
  }

  public async get(entity_id: string) {
    const client = await ClientRepository.fetch(entity_id);

    return {
      ...client,
      entity_id: client[EntityId],
    };
  }

  public async getAll() {
    const clients = await ClientRepository.search() //
      .sortBy("created_at", "ASC")
      .return.all();

    return clients.map((client) => {
      return {
        ...client,
        entity_id: client[EntityId],
      };
    });
  }

  public async delete(entity_id: string) {
    await ClientRepository.remove(entity_id);
    return true;
  }

  public async bidIncrements(client_entity_id: string) {
    const client = await ClientRepository.fetch(client_entity_id);

    if (!client.name) {
      throw new ValidationError(`Client not found.`);
    }

    return { bid_increments: client.bid_increments };
  }

  public async generateApiCredentials(client_entity_id: string) {
    const client = await ClientRepository.fetch(client_entity_id);

    if (!client.name) {
      throw new ValidationError(`Client not found.`);
    }

    const existingCredentials = await ApiCredentialRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .return.first();

    if (existingCredentials) {
      throw new ValidationError(`This client already has API credentials. You can decide to revoke and regenerate if needed.`);
    }

    const key = generateApiKey();
    const secret = generateApiSecret();

    const credentials = {
      api_key: key,
      api_secret: secret,
      access_token: jwt.sign({ api_key: key }, secret), // sign the api key with the secret
    };

    await ApiCredentialRepository.save({
      ...credentials,

      client_entity_id: client[EntityId],
      note: `API credentials for ${client.name}`,
      created_at: moment().tz("Africa/Johannesburg").unix(),
    });

    return {
      api_key: credentials.api_key,
      access_token: credentials.access_token,
    };
  }

  public async getApiCredentials(client_entity_id: string) {
    const client = await ClientRepository.fetch(client_entity_id);

    if (!client.name) {
      throw new ValidationError(`Client not found.`);
    }

    const credentials = await ApiCredentialRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .return.first();

    if (!credentials) {
      throw new ValidationError(`This client does not have API credentials.`);
    }

    return {
      entity_id: credentials[EntityId],
      api_key: credentials.api_key,
      access_token: credentials.access_token,
    };
  }

  public async exportUserEmailsCSV(client_entity_id: string) {
    const client = await ClientRepository.fetch(client_entity_id);
    if (!client.name) {
      throw new ValidationError(`Client not found.`);
    }

    const foundUsers = await UserRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .return.all();

    const users = foundUsers.map((u) => {
      return {
        name: u.name.toString(),
        surname: u.surname.toString(),
        email: u.email.toString(),
      };
    });

    // sort users by email
    users.sort((a, b) => {
      return a.email.localeCompare(b.email);
    });

    // build csv with titles
    let csv = `Name,Surname,Email\n`;
    for (let u of users) {
      csv += `${u.name},${u.surname},${u.email}\n`;
    }

    return csv;
  }

  public async saveSocialMedia(client_entity_id: string, social_media: any[]) {
    const client = await ClientRepository.fetch(client_entity_id);

    if (!client.name) {
      throw new ValidationError(`Client not found.`);
    }

    // delete any existing previous social media
    const existingSocialMedia = await SocialMediaRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .return.all();

    for (const sm of existingSocialMedia) {
      await SocialMediaRepository.remove(sm[EntityId]);
    }

    // save new social media
    for (const sm of social_media) {
      await SocialMediaRepository.save({
        ...sm,
        client_entity_id,
      });
    }
  }

  public async getSocialMedia(client_entity_id: string) {
    const client = await ClientRepository.fetch(client_entity_id);

    if (!client.name) {
      throw new ValidationError(`Client not found.`);
    }

    const socialMedia = await SocialMediaRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .return.all();

    return socialMedia.map((sm) => {
      return {
        ...sm,
        entity_id: sm[EntityId],
      };
    });
  }

  public async deleteSocialMedia(entity_id: string) {
    await SocialMediaRepository.remove(entity_id);
    return true;
  }

  public async contactUs(obj: any) {
    const { client_entity_id, name, email, subject, message, query_type } = obj;

    // Get the "to" email address from the client's configuration.
    const configuration = await ConfigurationCollection.findOne({ client_entity_id: client_entity_id });
    console.log("configuration", configuration);

    const to_email = configuration.contacts.email;

    const title = `Contact Us - ${subject}`;
    const body = `<b>Name:</b> ${name} <br/> <b>Email:</b> ${email} <br/> <b>Query Type:</b> ${query_type} <br/> <b>Subject:</b> ${subject} <br/> <b>Message:</b> ${message}`;

    // await QueryModel.create({
    //   ...obj,
    // });

    sendEmail({
      subject: title,
      body,
      to: to_email ?? process.env.GOOGLE_MAIL_TO,
    });

    return true;
  }
}
