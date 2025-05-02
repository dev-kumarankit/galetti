import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "SOCIALMEDIA";

const schema = new Schema(
  schemaName,
  {
    client_entity_id: { type: "string" },
    platform: { type: "string" },
    url: { type: "string" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(schema, redisClient);
repo.createIndex();

export { repo as SocialMediaRepository };
