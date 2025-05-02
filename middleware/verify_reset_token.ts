import jwt from "jsonwebtoken";
// import { RefreshTokenModel } from "../models/refresh_token";

export function verifyResetToken(req, res, next) {
  const resetToken: string = req.headers["reset_token"];
  console.log("headers resetToken", resetToken);

  if (resetToken) {
    jwt.verify(resetToken, process.env.JWT_SECRET ?? "", (err, authData) => {
      if (err) {
        res.sendStatus(403);
      } else {
        req.user = authData;
        next();
      }
    });
  } else {
    res.sendStatus(403);
  }
}
