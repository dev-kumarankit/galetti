import { Express, Router } from "express";
import { v3Router } from "./routes/v3";

export function routing(expressApp: Express) {
  // This is needed to let a Cloud Instnace know that the application is running fine.
  const router = Router();
  router.get("/", (req, res) => res.send("OK").status(200).end());
  router.get("/health", (req, res) => res.send("OK").status(200).end());
  expressApp.use("/", router);

  // TODO: Add more as needed.
  expressApp.use("/v3", v3Router);
}
