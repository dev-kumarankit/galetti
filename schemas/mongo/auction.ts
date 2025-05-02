import mongoose, { model, Document, Schema } from "mongoose";

/**
 * MongoDB schema for an Auction.
 */
const AuctionCollection = model<any & Document>(
  "Auction",
  new mongoose.Schema<any>(
    {
      // entity_id: {
      //   type: String,
      //   required: [true, "Auction entity_id is required"],
      // },
    },
    {
      timestamps: false,
      strict: false,
      versionKey: false,
      _id: false, // use redis's entity_id
    },
  ),
);

export { AuctionCollection };
