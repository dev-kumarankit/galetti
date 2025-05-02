import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "CONFIGURATION";

const configurationSchema = new Schema(
  schemaName,
  {
    client_entity_id: { type: "string" },
    home_youtube_url: { type: "string" },
    disclaimer_md_text: { type: "string" },
    terms_conditions_md_text: { type: "string" },
    privacy_policy_md_text: { type: "string" },
    created_at: { type: "date" },
    updated_at: { type: "date" },
    // contacts: {
    //   cell_number: { type: "string" },
    //   email: { type: "string" },
    //   whatsapp: { type: "string" },
    // },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(configurationSchema, redisClient);
repo.createIndex();

export { repo as ConfigurationRepository };
