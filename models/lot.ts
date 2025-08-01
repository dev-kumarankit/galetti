import { Entity } from "redis-om";
import { IContacts } from "./contacts";

export interface ILot extends Entity {
  auction_entity_id: string;
  title: string;
  description: string;
  starting_price?: number;
  reserve_price?: number;
  status: string;
  date_from: Date;
  date_to: Date;
  type: string;
  youtube_url?: string;
  lot_number: number;
  contacts?: IContacts;
  created_at: Date | number;
  updated_at?: Date | number;
  broker_name?: string;
  location?: {
    full_address: string;
    latitude: string;
    longitude: string;
  };
  vendor_bidding?: {
    enabled: boolean;
    bid_increment: number;
    bid_limit: number;
    timeout: number;
  };
  extra_data?: {
    key: string;
    value: string;
  }[];
}
