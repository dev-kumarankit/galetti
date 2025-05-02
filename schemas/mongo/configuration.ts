import mongoose, { model, Document, Schema } from "mongoose";

const ConfigurationCollection = model<any & Document>(
  "Configuration",
  new mongoose.Schema<any>(
    {
      client_entity_id: {
        type: String,
        required: [true, "client_entity_id is required"],
      },
      home_youtube_url: {
        type: String,
        required: [true, "home_youtube_url is required"],
      },
      disclaimer_md_text: {
        type: String,
        required: [true, "disclaimer_md_text is required"],
      },
      privacy_policy_md_text: {
        type: String,
        required: [true, "privacy_policy_md_text is required"],
      },
      terms_conditions_md_text: {
        type: String,
        required: [true, "terms_and_conditions_md_text is required"],
      },
      auction_rules_conditions_md_text: {
        type: String,
        required: [true, "auction_rules_conditions_md_text is required"],
      },
      contacts: {
        cell_number: {
          type: String,
          required: [true, "cell_number is required"],
        },
        email: {
          type: String,
          required: [true, "email is required"],
        },
        whatsapp: {
          type: String,
          required: [true, "whatsapp is required"],
        },
      },
    },
    {
      timestamps: false,
      strict: false,
      versionKey: false,
      _id: false, // use redis's entity_id
    },
  ),
);

export { ConfigurationCollection };
