import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, attachCurrentUser, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Container } from "typedi";
import { ArchiveService3 } from "../../../services/v3/archive";

const router = Router();
const archiveService = Container.get(ArchiveService3);

router.patch(
  "/archive",
  celebrate({
    [Segments.BODY]: Joi.object({
      entity_id: Joi.string().required(),
    }),
  }),
  isAuthorized,
  isAdmin,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { entity_id } = body;
      const response = await archiveService.archive(entity_id);
      return res.json(success("Successfully archived the auction!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to archive the auction!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/auctions_for_client",
  celebrate({
    [Segments.QUERY]: Joi.object({
      entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;

      const response = await archiveService.archivedAuctionsForClient(query.entity_id);
      return res.json(success("Successfully retrieved all archived auctions for client!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to retrieve all archived auctions for client!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/get",
  celebrate({
    [Segments.QUERY]: Joi.object({
      _id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      const { _id } = query;
      const response = await archiveService.get(_id);
      return res.json(success("Successfully retrieved the archived auction!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to retrieve the archived auction!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.patch(
  "/restore",
  celebrate({
    [Segments.BODY]: Joi.object({
      _id: Joi.string().required(),
    }),
  }),
  isAuthorized,
  isAdmin,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { _id } = body;
      const response = await archiveService.restore(_id);
      return res.json(success("Successfully restored the auction!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to restore the auction!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.delete(
  "/delete",
  celebrate({
    [Segments.BODY]: Joi.object({
      _id: Joi.string().required(),
    }),
  }),
  isAuthorized,
  isAdmin,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { _id } = body;
      const response = await archiveService.delete(_id);
      return res.json(success("Successfully deleted the archived auction!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to delete the archived auction!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as archiveRouter };
