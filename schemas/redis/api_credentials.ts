// client_entity_id: string;
// api_key: string;
// api_secret: string;
// note: string;

import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "APICREDENTIALS";

const schema = new Schema(
  schemaName,
  {
    client_entity_id: { type: "string" },
    api_key: { type: "string" },
    api_secret: { type: "string" },
    access_token: { type: "string" },
    note: { type: "string" },
    created_at: { type: "date" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(schema, redisClient);
repo.createIndex();

export { repo as ApiCredentialRepository };
