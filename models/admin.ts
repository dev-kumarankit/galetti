import { Entity } from "redis-om";

export interface IAdmin extends Entity {
  client_entity_id?: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  role: string;
}
