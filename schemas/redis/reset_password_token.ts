import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "RESETTOKEN";

const schema = new Schema(
  schemaName,
  {
    reset_token: { type: "string" },
    user_entity_id: { type: "string" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(schema, redisClient);
repo.createIndex();

export { repo as ResetTokenRepository };
