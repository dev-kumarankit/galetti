import { Entity } from "redis-om";

export interface IContacts extends Entity {
  cell_number?: number;
  email?: string;
  whatsapp?: number;
}
