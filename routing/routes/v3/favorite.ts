import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, attachCurrentUser, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Logger } from "../../../helpers/logger";
import { Container } from "typedi";
import { FileService3 } from "../../../services/v3/file";
import { FavoriteService3 } from "../../../services/v3/favorite";

const router = Router();
const favoriteService = Container.get(FavoriteService3);

router.post(
  "/add",
  celebrate({
    [Segments.BODY]: Joi.object({
      auction_entity_id: Joi.string().required(),
      lot_entity_id: Joi.string().required(),
      user_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { body } = req;
      let result = await favoriteService.addFavorite(body);
      return res.json(success("Successfully added the favorite!", result)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to add the favorite!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.delete(
  "/remove",
  celebrate({
    [Segments.BODY]: Joi.object({
      lot_entity_id: Joi.string().required(),
      user_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { body } = req;
      let results = await favoriteService.removeFavorite(body);
      return res.json(success("Successfully removed the favorite!", results)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to remove the favorite!`,
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
      lot_entity_id: Joi.string().required(),
      user_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { query } = req;
      let results = await favoriteService.getFavorite(query);
      return res.json(success("Successfully retrieved the favorite!", results)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to retieve the favorite!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/get_for_auction",
  celebrate({
    [Segments.QUERY]: Joi.object({
      auction_entity_id: Joi.string().required(),
      user_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    const logger = Container.get(Logger);
    try {
      const { query } = req;
      let results = await favoriteService.getFavoritesforAuction(query);
      return res.json(success("Successfully retrieved the favorites for the auction!", results)).status(200).end();
    } catch (e) {
      logger.logger.error("🔥 error: %o", e);
      return res
        .json(
          failure({
            message: `Failed to retrieve the favorites for the auction!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as favoriteRouter };
