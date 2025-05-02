import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "CLIENT";

const clientSchema = new Schema(
  schemaName,
  {
    name: { type: "string" },
    token: { type: "string" },
    bid_increments: { type: "number[]" },
    created_at: { type: "date", sortable: true },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(clientSchema, redisClient);
repo.createIndex();

export { repo as ClientRepository };
