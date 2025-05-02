import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Container } from "typedi";
import { BackupService3 } from "../../../services/v3/backup";

const router = Router();

const backupService = Container.get(BackupService3);

router.post(
  "/test",
  celebrate({
    [Segments.BODY]: Joi.object({
      redis_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { redis_id } = body;

      const resp = await backupService.test(redis_id);

      return res.json(success("Success!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as backupRouter };
