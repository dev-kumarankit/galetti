import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Container } from "typedi";
import { SMSService3 } from "../../../services/v3/sms";

const router = Router();

const smsService = Container.get(SMSService3);

router.post(
  "/verify",
  celebrate({
    [Segments.BODY]: Joi.object({
      client_entity_id: Joi.string().required(),
      phone_number: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { client_entity_id, phone_number } = req.body;

      const response = await smsService.verify(client_entity_id, phone_number);

      return res.json(success("Successfully sent verification SMS!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to send verification SMS!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as smsRouter };
