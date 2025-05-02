import jwt from "express-jwt";
import httpStatus from "http-status";
import config from "../config/config";

const getTokenFromHeader = (req, res, next) => {
  const { headers } = req;
  const { authorization } = headers;

  const splitAuthorization = authorization && authorization.split(" ");

  if (splitAuthorization && splitAuthorization[0] === "Bearer") {
    const token = splitAuthorization[1];
    if (!token) {
      const error = new Error("No Bearer Token");
      next(error);
    }

    return token;
  }

  return null;
};

const isAuthorized = jwt({
  userProperty: "decoded_token", // Will decode token into this field as part of request
  secret: config.jwtSecret,
  algorithms: [config.jwtAlgorithm],
  getToken: getTokenFromHeader,
});

const isAdmin: any = (req, res, next) => {
  const role = req.decoded_token?.role;
  if (role === "admin" || role === "super_admin") {
    next();
  } else {
    const error = new Error("Unauthorized: Permission denied.");
    error["status"] = 401;
    next(error);
  }
};

// const attachClient: any = (req, res, next) => {
//   if (req.decodedToken?.role === "admin") {
//     const { client_token } = req.headers;
//     req.decodedClientToken = parseJwt(client_token);
//   }

//   next();
// };

export {
  isAuthorized,
  isAdmin,
  //attachClient
};
