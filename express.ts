import express from "express";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import helmet from "helmet";
import fileUpload from "express-fileupload";
import cors from "cors";
import { ErrorHandlers } from "./middleware";
import { routing } from "./routing/routing";
import { celebrator } from "celebrate";

celebrator(
  {},
  {
    convert: true, // force conversions
  },
);

const errorHandlers = new ErrorHandlers();
const expressApp = express();

// The order of these use() funtions are actually important!
expressApp.use(bodyParser.json());

//Limits.
expressApp.use(bodyParser.urlencoded({ limit: "100mb", extended: false }));
expressApp.use(bodyParser.json({ limit: "100mb" }));

expressApp.use(methodOverride());
expressApp.use(helmet());
expressApp.use(cors());
expressApp.use(
  fileUpload({
    limits: {
      fileSize: 30 * 1024 * 1024, // 30 MB
    },
    safeFileNames: false, // non-alphanumeric characters except dashes and underscores will be stripped
    preserveExtension: true, // keep the file extension
  }),
);

// Support for different endpoint versions.
routing(expressApp);

//Error handlers.
expressApp.use(errorHandlers.unauthorized);
expressApp.use(errorHandlers.celebrateError);
expressApp.use(errorHandlers.notFound);
expressApp.use(errorHandlers.handler);

export { expressApp };
