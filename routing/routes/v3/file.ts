import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, attachCurrentUser, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Logger } from "../../../helpers/logger";
import { Container } from "typedi";
import { FileService3 } from "../../../services/v3/file";

const router = Router();
const fileService = Container.get(FileService3);

router.post(
  "/upload",
  celebrate({
    [Segments.BODY]: Joi.object({
      auction_entity_id: Joi.string().optional().allow(null),
      user_entity_id: Joi.string().optional().allow(null),
      lot_entity_id: Joi.string().optional().allow(null),
      bidder_entity_id: Joi.string().optional().allow(null),
      custom_name: Joi.string().optional().allow(null, ""),
        other_info: Joi.string().optional().allow(null, ""),
      type: Joi.string().valid("Image", "Document").required(),
    }).xor("auction_entity_id", "lot_entity_id", "user_entity_id", "bidder_entity_id"), // At least one of these fields must be present, but not more than one.
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { files, body } = req;
      let result = await fileService.upload(body, files);
      return res.json(success("Successfully uploaded the file!", result)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to upload the file!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/retrieve",
  celebrate({
    [Segments.BODY]: Joi.object({
      auction_entity_id: Joi.string().optional().allow(null, ""),
      user_entity_id: Joi.string().optional().allow(null, ""),
      lot_entity_id: Joi.string().optional().allow(null, ""),
      bidder_entity_id: Joi.string().optional().allow(null, ""),
    }).xor("auction_entity_id", "lot_entity_id", "user_entity_id", "bidder_entity_id"), // At least one of these fields must be present, but not more than one.
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { body } = req;
      let results = await fileService.retrieve(body);
      return res.json(success("Successfully retrieved files!", results)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to get the file!`,
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
      file_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      let result = await fileService.delete(req.body);
      return res.json(success("Successfully deleted the file!", result)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to delete the file!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.put(
  "/save_order",
  celebrate({
    // in te body, and array of {entity_id, order}[]
    [Segments.BODY]: Joi.object({
      ordered_files: Joi.array().items(
        Joi.object({
          entity_id: Joi.string().required(),
          order: Joi.number().required(),
        }),
      ),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { ordered_files } = req.body;

      const fileService = Container.get(FileService3);
      let result = await fileService.saveOrder(ordered_files);
      return res.json(success("Successfully saved the files order!", result)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to save the file's order!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as fileRouter };
