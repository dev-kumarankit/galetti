import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "BIDDER";

const bidderSchema = new Schema(
  schemaName,
  {
    client_entity_id: { type: "string" },
    user_entity_id: { type: "string" },
    is_verified: { type: "boolean" },
    paddle_number: { type: "string" },
    id_number: { type: "string" },
    address: { type: "string" },
    created_at: { type: "date" },
    registered_auction_id: { type: "string" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(bidderSchema, redisClient);
repo.createIndex();

export { repo as BidderRepository };
