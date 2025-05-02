import { Logger } from "../helpers/logger";
import httpStatus, { NOT_FOUND, UNAUTHORIZED } from "http-status";
import { isCelebrateError } from "celebrate";
import { failure } from "../helpers/responses/failure";
import { Container } from "typedi";

export class ErrorHandlers {
  // private loggerInstance = Container.get(Logger);

  unauthorized(err, req, res, next) {
    // console.log("ERROR1", err.name);
    // console.log("ERROR2", err.code);
    if (err && err.name == "UnauthorizedError") {
      const error = new Error("Unauthorized");
      error["status"] = httpStatus.UNAUTHORIZED;
      // console.log(error);
      // next(error);
      res.json(
        failure({
          message: "Unauthorized",
          //content: null,
          content: err,
        }),
      );
    }

    next(err);
  }

  notFound(req, res, next) {
    // console.log("ERROR3");
    const error = new Error("Endpoint Not Found");

    const originalUrl = req.originalUrl;
    console.error("Original Url:", originalUrl);

    error["status"] = httpStatus.NOT_FOUND;
    next(error);
    // if (err.status == 401) {
    // } else {
    //   const error = new Error("Not Found");
    //   error["status"] = httpStatus.NOT_FOUND;
    //   next(error);
    // }
  }

  celebrateError(err, req, res, next) {
    if (isCelebrateError(err)) {
      // this.logger.logger.silly("Celebrate error: %o", err);
      // const error = err;
      // error["status"] = httpStatus["400_MESSAGE"];
      // next(error);
      let queryErrors = err.details.get("query");
      let bodyErrors = err.details.get("body");
      let paramsErrors = err.details.get("params");
      let headerErrors = err.details.get("headers");

      console.log("queryErrors", queryErrors);
      console.log("bodyErrors", bodyErrors);
      console.log("paramsErrors", paramsErrors);
      console.log("headerErrors", headerErrors);

      if (queryErrors) {
        err["errors"] = queryErrors.details.map((x) => ({
          key: x.context.key,
          message: x.message,
        }));
      } else if (bodyErrors) {
        err["errors"] = bodyErrors.details.map((x) => ({
          key: x.context.key,
          message: x.message,
        }));
      } else if (paramsErrors) {
        err["errors"] = paramsErrors.details.map((x) => ({
          key: x.context.key,
          message: x.message,
        }));
      } else if (headerErrors) {
        err["errors"] = headerErrors.details.map((x) => ({
          key: x.context.key,
          message: x.message,
        }));
      }

      next(err);
    }
    next(err);
  }

  handler(err, req, res, next) {
    // this.loggerInstance.logger.silly("req %o", req);

    const response = {
      code: err.status ?? "unknown",
      message: err.message ?? "unknown",
      errors: err.errors ?? "unknown",
      stack: err.stack ?? "unknown",
    };
    // console.log("err", err);

    if (process.env.NODE_ENV !== "DEV") {
      delete response.stack;
    }

    res.status(err.status ?? httpStatus.BAD_REQUEST);
    res.json(
      failure({
        message: "Handled error.",
        content: response,
      }),
    );
    // next(response);

    // process.exit(-1);
  }
}
