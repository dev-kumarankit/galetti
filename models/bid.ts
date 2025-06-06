import { Entity } from "redis-om";

export interface IBid extends Entity {
  lot_entity_id: string;
  user_entity_id: string;
  amount: number;
  status: string;
  auction_id?: string;
  created_at?: Date | number;
}
