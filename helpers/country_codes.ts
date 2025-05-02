import country_codes from "../assets/country_codes.json";
import { Logger } from "./logger";
import { Container } from "typedi";

export function getCountryCodes() {
  const logger = Container.get(Logger);

  const cc = country_codes;
  logger.logger.silly("country_codes %o", cc);

  return cc;
}
