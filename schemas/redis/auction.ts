import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "AUCTION";

const lotSchema = new Schema(
  schemaName,
  {
    client_entity_id: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    status: { type: "string" },
    type: { type: "string" },
    date_from: { type: "date" },
    date_to: { type: "date" },
    is_popular: { type: "boolean" },
    is_top_auction: { type: "boolean" },
    is_automated: { type: "boolean" },
    youtube_url: { type: "string" },
    registration_fee: { type: "number" },
    created_by_user: { type: "string" },
    created_at: { type: "date", sortable: true },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(lotSchema, redisClient);
repo.createIndex();

/**
 * Redis schema repository for an Auction.
 */
const AuctionRepository = repo;
export { AuctionRepository };
