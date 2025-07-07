import { Entity } from "redis-om";

// Previously bidders had to register for each auction.
// However, now they only need to register once, linked to a client_entity_id
// instead of an auction_entity_id.
export interface IBidder extends Entity {
  client_entity_id: string;
  fullname?:string;
  email?:string;
  cell_phone?:any;
  user_entity_id: string;
  is_verified: boolean;
  registered_auction_id?: string;
  paddle_number: string; // string, becuase it can start with 0, eg 0123
  created_at: any;
}
