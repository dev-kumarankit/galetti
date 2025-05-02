// import { Logger } from "winston";
import jwt from "jsonwebtoken";
import config from "../config/config";
import { Logger } from "./logger";
import { Container } from "typedi";

export async function generateToken(user: any) {
  const logger = Container.get(Logger);

  // If we dont pass this "exp" date to jwt below, the token will never expire.
  const exp = new Date().setDate(new Date().getDate() + 60);

  const role = user.role ?? "unknown";

  logger.logger.info(`Signing JWT for ${role} [${user._id}]`);

  return jwt.sign(
    {
      _id: user._id,
      role: role,
      name: user.name,
      email: user.email,
      cell_number: user.cell_number,
    },
    config.jwtSecret,
  );
}

export interface ITokenToGenerate {
  entity_id: string;
  role: string; // "user" | "admin" | "super_admin" | "unknown";
  name: string;
  email: string;
  // cell_number: string;
}

export async function generateTokenNew(ttg: ITokenToGenerate) {
  const logger = Container.get(Logger);

  // If we dont pass this "exp" date to jwt below, the token will never expire.
  const exp = new Date().setDate(new Date().getDate() + 60);

  // if ttg is of type IClientTokenToGenerate

  const role = ttg.role ?? "unknown";

  // if the role is unsupproted
  if (!["user", "admin", "super_admin", "unknown"].includes(role)) {
    throw new Error(`Unsupported user role: ${role}`);
  }

  logger.logger.info(`Signing JWT for ${role} [${ttg.entity_id}]`);

  return jwt.sign(
    {
      entity_id: ttg.entity_id,
      role: role,
      name: ttg.name,
      email: ttg.email,
      // cell_number: user.cell_number,
    },
    config.jwtSecret,
  );
}

interface IClientTokenToGenerate {
  entity_id: string;
  name: string;
}

export async function generateClientToken(ttg: IClientTokenToGenerate) {
  const logger = Container.get(Logger);

  // If we dont pass this "exp" date to jwt below, the token will never expire.
  const exp = new Date().setDate(new Date().getDate() + 60);

  return jwt.sign(
    {
      entity_id: ttg.entity_id,
      name: ttg.name,
    },
    config.jwtSecret,
  );
}
