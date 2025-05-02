import { Entity } from "redis-om";

export interface IFirebaseToken extends Entity {
  user_entity_id: string;
  token: string;
  device_id: string;
}
