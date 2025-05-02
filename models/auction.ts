import { Entity } from "redis-om";
import { IContacts } from "./contacts";

export interface IAuction extends Entity {
  client_entity_id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  date_from: Date;
  date_to: Date;
  is_popular: boolean;
  is_top_auction: boolean;
  automated: {
    enabled: boolean;
    soft_closing: {
      enabled: boolean;
      timeout: number;
    };
  };
  youtube_url: string;
  registration_fee: number;
  contacts: IContacts;
  live_stream: {
    id: string;
    token: string;
    stream_name: string;
  };
  location: {
    full_address: string;
    latitude: string;
    longitude: string;
  };
  created_by_user: string;
  created_at: Date | number;
  updated_at: Date | number;
}
