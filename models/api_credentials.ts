import { Entity } from "redis-om";

export interface IApiCredentials extends Entity {
  client_entity_id: string;
  api_key: string;
  api_secret: string;
  access_token: string;
  note: string;
}
