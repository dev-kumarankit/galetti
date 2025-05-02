import { SchemaDefinitionProperty } from "mongoose";

export interface IFirebaseToken {
  user_id: SchemaDefinitionProperty<string>;
  token: string;
  device_id?: string;
}
