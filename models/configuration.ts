import { Entity } from "redis-om";

export interface IConfiguration extends Entity {
  client_entity_id: string;
  home_youtube_url?: string;
  disclaimer_md_text: string;
  terms_conditions_md_text: string;
  privacy_policy_md_text: string;
  auction_rules_conditions_md_text: string;
  contacts: {
    cell_number?: string;
    email?: string;
    whatsapp?: string;
  };
}
