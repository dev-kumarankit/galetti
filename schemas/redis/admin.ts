import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "ADMIN";

const schema = new Schema(
  schemaName,
  {
    client_entity_id: { type: "string" },
    name: { type: "string" },
    surname: { type: "string" },
    email: { type: "string" },
    password: { type: "string" },
    role: { type: "string" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(schema, redisClient);
repo.createIndex();

export { repo as AdminRepository };
