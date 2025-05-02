import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "BID";

const bidSchema = new Schema(
  schemaName,
  {
    auction_entity_id: { type: "string" },
    lot_entity_id: { type: "string" },
    user_entity_id: { type: "string" },
    amount: { type: "number", sortable: true },
    status: { type: "string" },
    created_at: { type: "date", sortable: true },
    updated_at: { type: "date" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(bidSchema, redisClient);
repo.createIndex();

export { repo as BidRepository };
