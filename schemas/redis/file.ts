import { Repository, Schema } from "redis-om";
import { redisClient } from "../../integration/redis/redis";

const schemaName = "FILE";

const fileSchema = new Schema(
  schemaName,
  {
    auction_entity_id: { type: "string" },
    user_entity_id: { type: "string" },
    lot_entity_id: { type: "string" },
    bidder_entity_id: { type: "string" },
    file_name: { type: "string" },
    file_extension: { type: "string" },
    custom_name: { type: "string" },
    type: { type: "string" },
    uploaded_file_url: { type: "string" },
    directory: { type: "string" },
    order: { type: "number", sortable: true },
    created_at: { type: "date", sortable: true },
    other_info: { type: "string" },
    // uploaded_file: {
    //   type: "object",
    //   fields: {
    //     file: { type: "any" },
    //     directory: { type: "string" },
    //     key: { type: "string" },
    //     url: { type: "string" },
    //   },
    // },
  },
  { dataStructure: "JSON" }
);

const repo = new Repository(fileSchema, redisClient);
repo.createIndex();

export { repo as FileRepository };
