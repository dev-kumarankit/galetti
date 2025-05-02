import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "CURRENTLOT";

const bidSchema = new Schema(
  schemaName,
  {
    auction_entity_id: { type: "string" },
    lot_entity_id: { type: "string" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(bidSchema, redisClient);
repo.createIndex();

export { repo as CurrentLotRepository };
