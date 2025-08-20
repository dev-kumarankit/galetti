import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "AUTOBID";

const bidSchema = new Schema(
  schemaName,
  {
    auction_entity_id: { type: "string" },
    lot_entity_id: { type: "string" },
    user_entity_id: { type: "string" },
    max_amount: { type: "number", sortable: true },
    increment_amount: { type: "number", sortable: true },
    status: { type: "string" },
    term_and_condition: { type: "string" },
    created_at: { type: "date", sortable: true },
    updated_at: { type: "date" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(bidSchema, redisClient);
repo.createIndex();

export { repo as AutoBidRepository };
