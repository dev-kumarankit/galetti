import { Container } from "typedi";
import { Logger } from "../helpers/logger";

// deprecared
export const attachCurrentUser = async (req, res, next) => {
  const logger = Container.get(Logger);

  try {
    const { decodedToken } = req;

    if (!decodedToken) {
      throw new Error("No decoded token found. Use in conjunction with 'isAuthorized' middleware.");
    }

    logger.logger.info("decoded token: %o", decodedToken);
    req.user_details = decodedToken;

    return next();
  } catch (e) {
    logger.logger.error("🔥 Error attaching user token to req: %o", e);
    return next(e);
  }
};
