import { Service } from "typedi";
import { EntityId } from "redis-om";

import { IConfiguration } from "../../models/configuration";
import { ConfigurationRepository } from "../../schemas/redis/configuration";
import { ClientRepository } from "../../schemas/redis/client";
import moment from "moment-timezone";
import { ConfigurationCollection } from "../../schemas/mongo/configuration";
import { getULID } from "../../integration/redis/redis";

@Service()
export class ConfigurationService3 {
  public async save(data: IConfiguration) {
    const client = await ClientRepository.fetch(data.client_entity_id);
    if (!client?.name) {
      throw new Error("Client not found");
    }

    console.log("data", data);

    // check if the configuration exists
    // const configuration = await ConfigurationRepository.search().where("client_entity_id").eq(data.client_entity_id).return.first();
    const configuration = await ConfigurationCollection.findOne({ client_entity_id: data.client_entity_id });
    console.log("configuration", configuration);

    if (configuration) {
      await ConfigurationCollection.updateOne(
        { client_entity_id: data.client_entity_id },
        {
          $set: {
            ...data,
            // updated_at: moment().tz("Africa/Johannesburg").unix(),
          },
        },
      );
    } else {
      await ConfigurationCollection.create({
        ...data,
        _id: getULID(),
        // created_at: moment().tz("Africa/Johannesburg").unix(),
      });
    }

    const savedData = await ConfigurationCollection.findOne({ client_entity_id: data.client_entity_id });

    return savedData;
  }

  public async get(client_entity_id: string) {
   // const configurationMongo = await ConfigurationCollection.findOne({ client_entity_id });

   // if (configurationMongo) {
   //   return {
   //     ...configurationMongo.toObject(), //
   //     terms_contitions_md_text: configurationMongo.terms_conditions_md_text ?? "", // This "spelling mistake mapping" can be removed in the future after all apps has been updated.
   //   };
  //  } else {
      const configuration = await ConfigurationRepository.search().where("client_entity_id").eq(client_entity_id).return.first();
	console.log(configuration,"configuration")
      return configuration;
  //  }
  }
}
