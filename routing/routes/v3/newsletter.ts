import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, attachCurrentUser, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Logger } from "../../../helpers/logger";
import { Container } from "typedi";
import { NewsletterService3 } from "../../../services/v3/newsletter";

const router = Router();
const newsletterService = Container.get(NewsletterService3);

router.post(
  "/subscribe",
  celebrate({
    [Segments.BODY]: Joi.object({
      client_entity_id: Joi.string().required(),
      email_address: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { body } = req;
      const { email_address, client_entity_id } = body;
      let result = await newsletterService.subscribe(email_address, client_entity_id);
      return res.json(success("Successfully subscribed to newsletter!", result)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to subscribe to newsletter!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as newsletterRouter };
