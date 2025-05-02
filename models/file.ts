import { Entity } from "redis-om";

export interface IFile extends Entity {
  auction_entity_id?: string;
  user_entity_id?: string;
  lot_entity_id?: string;
  bidder_entity_id?: string;
  file_name: string;
  file_extension: string;
  custom_name?: string;
  type: string;
  uploaded_file_url: string;
  directory: string;
  order: number;
}
