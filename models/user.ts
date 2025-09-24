import { Entity } from "redis-om";

export interface IUser extends Entity {
  client_entity_id: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  get_communication?: boolean;
  agrees_terms_and_conditions: boolean;
  id_number?: string;
  address?: string;
  role?:string;
  salt?:string;
  created_at?:string;
  device?: {
    device_id: string;
    firebase_token: string;
  };
  cell_phone: {
    calling_code: string;
    country_code: string;
    number: string;
  };
}
