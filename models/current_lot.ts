import { Entity } from "redis-om";

// used in conjunction with the manual live auctions.
export interface ICurrentLot extends Entity {
  auction_entity_id: string;
  lot_entity_id: string;
}
