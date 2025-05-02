import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "FAVORITE";

const favoriteSchema = new Schema(
  schemaName,
  {
    auction_entity_id: { type: "string" },
    lot_entity_id: { type: "string" },
    user_entity_id: { type: "string" },
    created_at: { type: "date" },
  },
  { dataStructure: "JSON" },
);

const repo = new Repository(favoriteSchema, redisClient);
repo.createIndex();

export { repo as FavoriteRepository };
