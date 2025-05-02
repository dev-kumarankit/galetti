import { Entity } from "redis-om";

export interface IOTP extends Entity {
  otp: string;
  user_entity_id: string;
}
