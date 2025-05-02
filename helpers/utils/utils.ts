import { Container } from "typedi";
import { Logger } from "../logger";
import { stripSpecialCharacters } from "./strip_special_characters";

function isJsonString(str) {
  const logger = Container.get(Logger);

  try {
    JSON.parse(str);
  } catch (error) {
    logger.logger.error("Could not parse string to a valid JSON object: %o", error);
    return false;
  }
  return true;
}

function generateOTP(length: number = 4) {
  // Declare a digits variable
  // which stores all digits
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

function parseJwt(token: string) {
  if (token !== undefined && token !== null && token !== "undefined" && token !== "null") {
    return JSON.parse(Buffer.from(token.split(".")![1], "base64").toString());
  }
}

export { isJsonString, generateOTP, stripSpecialCharacters, parseJwt };
