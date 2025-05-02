import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "OTP";

const schema = new Schema(
  schemaName,
  {
    otp: { type: "string" },
    user_entity_id: { type: "string" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(schema, redisClient);
repo.createIndex();

export { repo as OTPRepository };
