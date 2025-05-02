import { Container } from "typedi";
import { Logger } from "../helpers/logger";

// deprecared
export const attachDecodedToken = async (req, res, next) => {
  const logger = Container.get(Logger);

  try {
    const { decoded_token } = req;

    if (!decoded_token) {
      throw new Error("No decoded token found. The 'isAuthorized' middleware should be called right above this one.");
    }

    console.log("decoded token:", decoded_token);
    req.decoded_token = decoded_token;

    return next();
  } catch (e) {
    logger.logger.error("🔥 Error attaching user token to req: %o", e);
    return next(e);
  }
};
