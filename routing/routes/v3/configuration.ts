import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, attachCurrentUser, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Logger } from "../../../helpers/logger";
import { Container } from "typedi";
import { FileService3 } from "../../../services/v3/file";
import { ConfigurationService3 } from "../../../services/v3/configuration";

const router = Router();
const configurationService = Container.get(ConfigurationService3);

router.post(
  "/save",
  celebrate({
    [Segments.BODY]: Joi.object({
      client_entity_id: Joi.string().required(),
      home_youtube_url: Joi.string().optional().allow(""),
      disclaimer_md_text: Joi.string().required(),
      terms_conditions_md_text: Joi.string().required(),
      privacy_policy_md_text: Joi.string().required(),
      auction_rules_conditions_md_text: Joi.string().required(),
      contacts: Joi.object({
        cell_number: Joi.string().optional(),
        email: Joi.string().optional(),
        whatsapp: Joi.string().optional(),
      }),
    }),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { body } = req;
      let result = await configurationService.save(body);
      return res.json(success("Successfully saved the configuration!", result)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to save the configuration!`,
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
      client_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { query } = req;
      let result = await configurationService.get(query.client_entity_id);
      return res.json(success("Successfully fetched the client's configuration!", result)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to fetch the client's configuration!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as configurationRouter };
