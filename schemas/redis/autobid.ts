// import { Repository, Schema } from "redis-om";
// import { redisClient } from "../../integration/redis/redis";

// const schemaName = "AUTOBID";

// const bidSchema = new Schema(
//   schemaName,
//   {
//     auction_entity_id: { type: "string" },
//     lot_entity_id: { type: "string" },
//     user_entity_id: { type: "string" },
//     max_amount: { type: "number", sortable: true },
//     increment_amount: { type: "number", sortable: true },
//     status: { type: "string" },
//     term_and_condition: { type: "string" },
//     created_at: { type: "date", sortable: true },
//     updated_at: { type: "date" },
//   },
//   { dataStructure: "JSON" },
// );

// const repo = new Repository(bidSchema, redisClient);
// repo.createIndex();

// export { repo as AutoBidRepository };
import { Repository, Schema, Entity } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "AUTOBID";

export interface IAutoBid extends Entity {
  auction_entity_id: string;
  lot_entity_id: string;
  user_entity_id: string;
  max_amount?: number;
  increment_amount?: any;
  status?: string;
  term_and_condition?: string;
  created_at?: any;
  updated_at?: any;
}

const autoBidSchema = new Schema(
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
  { dataStructure: "JSON" }
);

// Explicit cast so TS knows this repo works with IAutoBid
const repo = new Repository<IAutoBid>(autoBidSchema, redisClient) as Repository<IAutoBid>;
repo.createIndex();

export { repo as AutoBidRepository };

