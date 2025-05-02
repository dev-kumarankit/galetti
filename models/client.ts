import { Entity } from "redis-om";

// Previously bidders had to register for each auction.
// However, now they only need to register once, linked to a client_entity_id
// instead of an auction_entity_id.
export interface IClient extends Entity {
  name: string;
  token?: string;
  bid_increments: number[];
  created_at?: Date | number;
}
