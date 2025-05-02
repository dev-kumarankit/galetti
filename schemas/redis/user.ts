import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "USER";

const schema = new Schema(
  schemaName,
  {
    client_entity_id: { type: "string" },
    name: { type: "string" },
    surname: { type: "string" },
    // cell_country_code: { type: "string" },
    // cell_number: { type: "string" },
    email: { type: "string" },
    password: { type: "string" },
    id_number: { type: "string" },
    address: { type: "string" },
    get_communication: { type: "boolean" },
    agrees_terms_and_conditions: { type: "boolean" },
    role: { type: "string" },
    // device: {
    //   type: "object",
    //         fields: {
    //     device_id: { type: "string", required: true },
    //     firebase_token: { type: "string", required: true },
    //   },
    // },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(schema, redisClient);
repo.createIndex();

export { repo as UserRepository };
