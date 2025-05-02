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
import ValidationError from "../../../helpers/validation_error";

const router = Router();
const bidService = Container.get(BidService3);

router.post(
  "/place",
  celebrate({
    [Segments.BODY]: Joi.object({
      lot_entity_id: Joi.string().required(),
      user_entity_id: Joi.string().required(),
      amount: Joi.number().optional(),
      increment: Joi.number().optional(),
    })
      .or("amount", "increment")
      .xor("amount", "increment"),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const response = await bidService.placeBid(body);
      return res.json(success("Successfully placed a bid!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);

      if (e instanceof ValidationError) {
        return res
          .json(
            failure({
              message: e.message,
            }),
          )
          .status(400)
          .end();
      } else {
        return res
          .json(
            failure({
              message: "Failed to place a bid!",
              e,
            }),
          )
          .status(400)
          .end();
      }
    }
  },
);

router.post(
  "/place_system",
  celebrate({
    [Segments.BODY]: Joi.object({
      lot_entity_id: Joi.string().required(),
      increment: Joi.number().required(),
      type: Joi.string().valid("floor", "vendor").required(),
    }),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { lot_entity_id, increment, type } = body;

      const response = await bidService.placeSystemBid(lot_entity_id, increment, type);
      return res.json(success("Successfully placed a floor bid!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);

      if (e instanceof ValidationError) {
        return res
          .json(
            failure({
              message: e.message,
            }),
          )
          .status(400)
          .end();
      } else {
        return res
          .json(
            failure({
              message: "Failed to place a floor bid!",
              e,
            }),
          )
          .status(400)
          .end();
      }
    }
  },
);

router.post(
  "/place_system_custom",
  celebrate({
    [Segments.BODY]: Joi.object({
      lot_entity_id: Joi.string().required(),
      amount: Joi.number().required(),
      type: Joi.string().valid("floor", "vendor").required(),
    }),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { lot_entity_id, amount, type } = body;

      const response = await bidService.placeSystemCustomBid(lot_entity_id, amount, type);
      return res.json(success("Successfully placed a custom floor bid!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);

      if (e instanceof ValidationError) {
        return res
          .json(
            failure({
              message: e.message,
            }),
          )
          .status(400)
          .end();
      } else {
        return res
          .json(
            failure({
              message: "Failed to place a custom floor bid!",
              e,
            }),
          )
          .status(400)
          .end();
      }
    }
  },
);

router.get(
  "/bids_for_lot",
  celebrate({
    [Segments.QUERY]: Joi.object({
      entity_id: Joi.string().required(),
      page: Joi.number().optional().default(0),
      limit: Joi.number().optional().default(10),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      const { entity_id, page, limit } = query;
      const response = await bidService.bidsForLot(entity_id, page, limit);
      return res.json(success("Successfully fetched bids for lot!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to fetch bids for lot!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/reject",
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
      const response = await bidService.reject(entity_id);
      return res.json(success("Successfully rejected bid!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to reject bid!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/back_up",
  celebrate({
    [Segments.BODY]: Joi.object({
      entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { entity_id } = body;
      const response = await bidService.backUp(entity_id);
      return res.json(success("Successfully backed up bid!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to back up bid!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.delete(
  "/delete_all_for_lot",
  celebrate({
    [Segments.BODY]: Joi.object({
      lot_entity_id: Joi.string().required(),
    }),
  }),
  isAuthorized,
  isAdmin,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_token } = req;
      const { lot_entity_id } = body;
      const response = await bidService.deleteAllForLot(lot_entity_id);
      return res.json(success("Successfully deleted all bids for lot!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to delete all bids for lot!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.delete(
  "/delete_all_for_auction",
  celebrate({
    [Segments.BODY]: Joi.object({
      auction_entity_id: Joi.string().required(),
    }),
  }),
  isAuthorized,
  isAdmin,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_token } = req;
      const { auction_entity_id } = body;
      const response = await bidService.deleteAllForAuction(auction_entity_id);
      return res.json(success("Successfully deleted all bids for auction!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to delete all bids for auction!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/bidding_history_for_user",
  celebrate({
    [Segments.QUERY]: Joi.object({
      user_entity_id: Joi.string().required(),
    }),
  }),
  isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { query } = req;
      const { user_entity_id, page, limit } = query;
      const response = await bidService.biddingHistoryForUser(user_entity_id);
      return res.json(success("Successfully fetched bidding history for user!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to fetch bidding history for user!",
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as bidRouter };
