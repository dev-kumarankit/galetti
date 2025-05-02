import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Container } from "typedi";
import { ExternalService3 } from "../../../services/v3/external";
import { userCelebrate } from "./user";
import { verifyApiCredentials } from "../../../middleware/verify_api_credentials";

const router = Router();

const externalService = Container.get(ExternalService3);

router.post(
  "/create_user",
  celebrate({
    [Segments.BODY]: Joi.object({
      ...userCelebrate,
      id_number: Joi.string().required(),
      address: Joi.string().required(),
    }),
  }),
  verifyApiCredentials,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_api_credentials } = req;

      const response = await externalService.create_user(decoded_api_credentials, body);

      return res.json(success("Successfully created a new user! A password has been generated and sent to their email address.", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to create a new user!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/register_bidder",
  celebrate({
    [Segments.BODY]: Joi.object({
      user_entity_id: Joi.string().required(),
    }),
  }),
  verifyApiCredentials,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_api_credentials } = req;
      const { user_entity_id } = body;

      const response = await externalService.register_user(decoded_api_credentials, user_entity_id);

      return res.json(success("Successfully registered the user for bidding!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to register the user for bidding!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/user_bidder_status",
  celebrate({
    [Segments.QUERY]: Joi.object({
      user_entity_id: Joi.string().required(),
      auction_entity_id: Joi.string().allow("").optional(),
    }),
  }),
  verifyApiCredentials,
  async (req: any, res: Response) => {
    try {
      const { query, decoded_api_credentials } = req;
      const { user_entity_id,auction_entity_id } = query;

      const response = await externalService.bidder_status(decoded_api_credentials, user_entity_id,auction_entity_id);

      return res.json(success("Successfully fetched the bidder status!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to fetch the bidder status!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/upload_proof_of_id",
  celebrate({
    [Segments.HEADERS]: Joi.object({
      "content-type": Joi.string()
        .pattern(/multipart\/form-data/)
        .required(),
    }).unknown(),
    [Segments.BODY]: Joi.object({
      bidder_entity_id: Joi.string().optional().allow(null),
    }),
  }),
  verifyApiCredentials,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_api_credentials, files } = req;
      const { bidder_entity_id } = body;

      const response = await externalService.upload_proof_of_id(decoded_api_credentials, bidder_entity_id, files);

      return res.json(success("Successfully uploaded the proof of ID!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to upload the proof of ID!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/upload_proof_of_address",
  celebrate({
    [Segments.HEADERS]: Joi.object({
      "content-type": Joi.string()
        .pattern(/multipart\/form-data/)
        .required(),
    }).unknown(),
    [Segments.BODY]: Joi.object({
      bidder_entity_id: Joi.string().optional().allow(null),
    }),
  }),
  verifyApiCredentials,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_api_credentials, files } = req;
      const { bidder_entity_id } = body;

      const response = await externalService.upload_proof_of_address(decoded_api_credentials, bidder_entity_id, files);

      return res.json(success("Successfully uploaded the proof of address!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to upload the proof of address!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.patch(
  "/bidder_verification",
  celebrate({
    [Segments.BODY]: Joi.object({
      bidder_entity_id: Joi.string().required(),
      verified: Joi.boolean().required(),
    }),
  }),
  verifyApiCredentials,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_api_credentials } = req;
      const { bidder_entity_id, verified } = body;

      const response = await externalService.verifyBidder(decoded_api_credentials, bidder_entity_id, verified);

      let message = "";
      if (response.is_verified) {
        message = "Successfully verified the bidder!";
      } else {
        message = "Successfully unverified the bidder!";
      }

      return res.json(success(message, response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to update the bidder's verification!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as externalRouter };
