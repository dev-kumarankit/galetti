import mongoose from "mongoose";

const RegisteredAuctionUser = new mongoose.Schema(
  {
    client_entity_id: { type: String, required: true },
    user_entity_id: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    oldId: { type: String, required: false, default: null },
    registered_auction_id: { type: String, required: false },
  },
  { timestamps: true },
);

const RegisteredAuctionUserModel = mongoose.model("registered_auction_user", RegisteredAuctionUser, "registered_auction_user");

export default RegisteredAuctionUserModel;
