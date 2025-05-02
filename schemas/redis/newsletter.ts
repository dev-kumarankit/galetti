import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "NEWSLETTER";

const schema = new Schema(
  schemaName,
  {
    client_entity_id: { type: "string" },
    email_address: { type: "string" },
    created_at: { type: "date" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(schema, redisClient);
repo.createIndex();

export { repo as NewsletterRepository };
