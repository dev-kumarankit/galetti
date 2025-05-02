import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "FIREBASETOKEN";

const schema = new Schema(
  schemaName,
  {
    user_entity_id: { type: "string" },
    token: { type: "string" },
    device_id: { type: "string" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(schema, redisClient);
repo.createIndex();

export { repo as FirebaseTokenRepository };
