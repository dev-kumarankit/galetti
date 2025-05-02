import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, attachCurrentUser, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Container } from "typedi";
import { FirebaseService3 } from "../../../services/v3/firebase";

const router = Router();

const firebaseService = Container.get(FirebaseService3);

router.post(
  "/preserve_token",
  celebrate({
    [Segments.BODY]: Joi.object({
      user_entity_id: Joi.string().required(),
      token: Joi.string().required(),
      device_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { user_entity_id, token, device_id } = req.body;

      const resp = await firebaseService.preserveToken({
        user_entity_id,
        token,
        device_id,
      });

      return res.json(success("Successfully updated firebase token!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to update firebase token!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/get_user_tokens",
  celebrate({
    [Segments.QUERY]: Joi.object({
      user_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { user_entity_id } = req.query;

      const resp = await firebaseService.getUserTokens(user_entity_id);

      return res.json(success("Successfully retrieved user's firebase tokens!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to retrieve user's firebase tokens!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/send_notification_to_everyone",
  celebrate({
    [Segments.BODY]: Joi.object({
      title: Joi.string().required(),
      body: Joi.string().required(),
      data: Joi.object().optional().allow(null),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { title, body, data } = req.body;

      const resp = await firebaseService.sendNotificationToEveryone({
        notification: {
          title: title,
          body: body,
        },
        data: data,
      });

      return res.json(success("Successfully sent a notification to everyone!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to send a notification to everyone!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/send_notification_to_users",
  celebrate({
    [Segments.BODY]: Joi.object({
      title: Joi.string().required(),
      body: Joi.string().required(),
      data: Joi.object().optional().allow(null),
      user_entity_ids: Joi.array().items(Joi.string()).required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { title, body, data, user_entity_ids } = req.body;

      const resp = await firebaseService.sendNotificationToUsers(
        {
          notification: {
            title: title,
            body: body,
          },
          data: data,
        },
        user_entity_ids,
      );

      return res.json(success("Successfully sent a notification to the specified users!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to send a notification to the specified users!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as firebaseRouter };
