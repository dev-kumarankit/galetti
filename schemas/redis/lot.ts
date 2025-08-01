import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "LOT";

const lotSchema = new Schema(
  schemaName,
  {
    auction_entity_id: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    starting_price: { type: "number" },
    reserve_price: { type: "number" },
    status: { type: "string" },
    type: { type: "string" },
    youtube_url: { type: "string" },
    lot_number: { type: "number", sortable: true },
    created_at: { type: "date" },
    date_from: { type: "date" },
    date_to: { type: "date" },
    updated_date_to: { type: "date" },
    // extra_data: { type: "string" },
    // vendor_bidding: { type: "string" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(lotSchema, redisClient);
repo.createIndex();

/**
* Redis schema repository for a Lot.
*/
const LotRepository = repo;
export { LotRepository };
