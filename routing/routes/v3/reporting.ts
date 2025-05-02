import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, attachCurrentUser, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Logger } from "../../../helpers/logger";
import { Container } from "typedi";
import { ReportingService3 } from "../../../services/v3/reporting";

const router = Router();
const reportingService = Container.get(ReportingService3);

router.get(
  "/auction_report",
  celebrate({
    [Segments.QUERY]: Joi.object({
      entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { query } = req;
      const { entity_id } = query;
      let result = await reportingService.auctionReport(entity_id);
      return res.json(success("Successfully retrieved auction report!", result)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to retrieve auction report!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/auction_report_csv",
  celebrate({
    [Segments.QUERY]: Joi.object({
      entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { query } = req;
      const { entity_id } = query;
      let result = await reportingService.auctionReportCSV(entity_id);
      return res.json(success("Successfully retrieved auction report CSV!", result)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to retrieve auction report CSV!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/auction_summary",
  celebrate({
    [Segments.QUERY]: Joi.object({
      entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;

      const response = await reportingService.auctionSummary(query.entity_id);
      return res.json(success("Successfully retrieved the auction summary!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to retrieve the auction summary!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as reportingRouter };
