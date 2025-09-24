import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "AUCTION_TUTOR";

const lotSchema = new Schema(
  schemaName,
  {
    url: { type: "string" },
    client_entity_id:{ type: "string" },
    created_at: { type: "date", sortable: true },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(lotSchema, redisClient);
repo.createIndex();

/**
 * Redis schema repository for an Auction.
 */
const AuctionTutorRepository = repo;
export { AuctionTutorRepository };
