import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, attachCurrentUser, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Logger } from "../../../helpers/logger";
import { LOT_STATUSES, LOT_TYPES } from "../../../helpers/constants/lot_enums";
import { Container } from "typedi";
import { LotService3 } from "../../../services/v3/lot";
import { BidService3 } from "../../../services/v3/bid";
import { BID_STATUSES } from "../../../helpers/constants/bid_enums";
import { BidderService3 } from "../../../services/v3/bidder";
import { ClientService3 } from "../../../services/v3/client";

const router = Router();
const clientService = Container.get(ClientService3);

router.post(
  "/create",
  celebrate({
    [Segments.BODY]: Joi.object({
      name: Joi.string().required(),
      bid_increments: Joi.array().items(Joi.number()).optional().allow(null).default([]),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { name, bid_increments } = body;
      const response = await clientService.create({
        name,
        bid_increments,
      });
      return res.json(success("Successfully registered bidder!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to register bidder!",
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
      entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      const { entity_id } = query;
      const response = await clientService.get(entity_id);
      return res.json(success(`Successfully retrieved client!`, response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to retrieve client!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.put(
  "/update",
  celebrate({
    [Segments.BODY]: Joi.object({
      entity_id: Joi.string().required(),
      name: Joi.string().required(),
      bid_increments: Joi.array().items(Joi.number()).required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { entity_id } = body;
      const response = await clientService.update(entity_id, {
        name: body.name,
        bid_increments: body.bid_increments,
      });
      return res.json(success(`Successfully updated client!`, response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to update client!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/get_all",
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { entity_id } = body;
      const response = await clientService.getAll();
      return res.json(success(`Successfully retrieved all clients!`, response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to retrieve all clients!",
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
      entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { entity_id } = body;
      const response = await clientService.delete(entity_id);
      return res.json(success("Successfully deleted the client!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to delete the client!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/bid_increments",
  celebrate({
    [Segments.QUERY]: Joi.object({
      client_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      const { client_entity_id } = query;

      const response = await clientService.bidIncrements(client_entity_id);
      return res.json(success("Successfully fetched bidding increments!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to fetch bidding increments!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/generate_api_credentials",
  celebrate({
    [Segments.BODY]: Joi.object({
      client_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  async (req: any, res: Response) => {
    try {
      const { body } = req;
      const { client_entity_id } = body;

      const response = await clientService.generateApiCredentials(client_entity_id);
      return res.json(success("Successfully generated API credentials!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to generate API credentials!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/api_credentials",
  celebrate({
    [Segments.QUERY]: Joi.object({
      client_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  async (req: any, res: Response) => {
    try {
      const { query } = req;
      const { client_entity_id } = query;

      const response = await clientService.getApiCredentials(client_entity_id);
      return res.json(success("Successfully fetched API credentials!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to fetch API credentials!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/export_user_emails_csv",
  celebrate({
    [Segments.QUERY]: Joi.object({
      client_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  async (req: any, res: Response) => {
    try {
      const { query } = req;
      const { client_entity_id } = query;

      const response = await clientService.exportUserEmailsCSV(client_entity_id);
      return res.json(success("Successfully exported user emails CSV!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to export user emails CSV!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/save_social_media",
  celebrate({
    [Segments.BODY]: Joi.object({
      client_entity_id: Joi.string().required(),
      social_media: Joi.array()
        .items(
          Joi.object({
            platform: Joi.string()
              .valid("facebook", "youtube", "linkedin", "instagram", "twitter", "tiktok", "whatsapp") //
              .required(),
            url: Joi.string().required(),
          }),
        )
        .required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { body } = req;
      const { client_entity_id, social_media } = body;

      const response = await clientService.saveSocialMedia(client_entity_id, social_media);
      return res.json(success("Successfully updated social media links!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to update social media links!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/get_social_media",
  celebrate({
    [Segments.QUERY]: Joi.object({
      client_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { query } = req;
      const { client_entity_id } = query;

      const response = await clientService.getSocialMedia(client_entity_id);
      return res.json(success("Successfully fetched social media links!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to fetch social media links!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.delete(
  "/delete_social_media",
  celebrate({
    [Segments.BODY]: Joi.object({
      entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { body } = req;
      const { entity_id } = body;

      const response = await clientService.deleteSocialMedia(entity_id);
      return res.json(success("Successfully deleted social media link!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to delete social media link!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/contact_us",
  celebrate({
    [Segments.BODY]: Joi.object({
      client_entity_id: Joi.string().required(),
      name: Joi.string().required(),
      email: Joi.string().required(),
      query_type: Joi.string().required(),
      subject: Joi.string().required(),
      message: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { body } = req;

      const response = await clientService.contactUs(body);
      return res.json(success("Successfully submitted query!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to submit query!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as clientRouter };
