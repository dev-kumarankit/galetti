import winston from "winston";
import config from "../config/config";
import "reflect-metadata";
import { Service } from "typedi";

@Service()
export class Logger {
  logger = winston.createLogger({
    level: config.logs.level,
    levels: winston.config.npm.levels,
    format: winston.format.combine(
      winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    ),
    transports: this.getTransports(),
  });

  private getTransports() {
    const transports = [];
    if (process.env.NODE_ENV == "DEV") {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(winston.format.cli(), winston.format.splat()),
        }),
      );
    } else {
      transports.push(new winston.transports.Console());
    }
    return transports;
  }
}
