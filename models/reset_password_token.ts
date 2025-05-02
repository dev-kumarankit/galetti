import { Entity } from "redis-om";

export interface IResetPasswordToken extends Entity {
  reset_token: string;
  user_entity_id: string;
}
