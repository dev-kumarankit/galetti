import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, attachCurrentUser, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Logger } from "../../../helpers/logger";
import { LOT_STATUSES, LOT_TYPES } from "../../../helpers/constants/lot_enums";
import { Container } from "typedi";
import { LotService3 } from "../../../services/v3/lot";
import { parseJwt } from "../../../helpers/utils/utils";
import { UserService3 } from "../../../services/v3/user";
import { verifyResetToken } from "../../../middleware/verify_reset_token";

const router = Router();

const userService = Container.get(UserService3);

const userCelebrate = {
  name: Joi.string().trim().required(),
surname: Joi.string().trim().allow('').optional(),
  cell_phone: Joi.object({
    calling_code: Joi.string()
      .pattern(
        /^\+/, //
        "Needs to start with a + sign.",
      )
      .required(), // eg: +27
    country_code: Joi.string().required(), // eg: ZA
    number: Joi.string().trim().required(), // eg: 0123456789
  }).required(),
  // email: Joi.string().lowercase().trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  // get_communication: Joi.bool().optional(),
  // agrees_terms_and_conditions: Joi.bool().required(),
};

router.post(
  "/sign_up",
  celebrate({
    [Segments.BODY]: Joi.object({
      client_entity_id: Joi.string().required(),
      // password: Joi.string().trim().required(),
      ...userCelebrate,
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const resp = await userService.signUp(req.body);

      return res.json(success("Successfully signed up!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to sign up!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/create",
  celebrate({
    [Segments.BODY]: Joi.object({
      client_entity_id: Joi.string().required(),
      ...userCelebrate,
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const resp = await userService.create(req.body);

      return res.json(success("Successfully created user!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to create user!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.patch(
  "/update",
  celebrate({
    [Segments.BODY]: Joi.object({
      entity_id: Joi.string().required(),
      entity: Joi.object({
        ...userCelebrate,
        id_number: Joi.string().optional().allow(null).trim(),
        address: Joi.string().optional().allow(null).trim(),
      }).required(),
    }),
  }),
  isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_token } = req;
      const { entity_id, entity } = body;

      const resp = await userService.update(entity_id, entity);

      return res.json(success("Successfully updated user!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to update user!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/log_in",
  celebrate({
    [Segments.BODY]: Joi.object({
      client_entity_id: Joi.string().required(),
      email: Joi.string().lowercase().trim().required(),
      password: Joi.string().trim(),
      // password: Joi.string().trim().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { email, password, client_entity_id } = req.body;

      const resp = await userService.logIn(email, password, client_entity_id);

      return res.json(success("Successfully logged in!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to log in!`,
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
      user_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { user_entity_id } = req.query;

      const resp = await userService.get(user_entity_id);

      return res.json(success("Successfully retrieved user!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to retrieve user!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/users_for_client",
  celebrate({
    [Segments.QUERY]: Joi.object({
      client_entity_id: Joi.string().required(),
      page: Joi.string().required(),
      limit: Joi.string().required(),
      name: Joi.string().allow(null, "").empty("").optional(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      // const { client_entity_id } = req.query;

      const resp = await userService.usersForClient(req.query);

      return res.json(success("Successfully fetched all users!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to fetch all users!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);
router.get(
  "/auto_bid_users_for_client",
  celebrate({
    [Segments.QUERY]: Joi.object({
      client_entity_id: Joi.string().required(),
      auction_entity_id: Joi.string().optional(),
       lot_entity_id: Joi.string().optional(),
      // page: Joi.string().required(),
      // limit: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const resp = await userService.autoBidUsersForClient(req.query);
      return res.json(success("Successfully fetched all auto bid users!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to fetch all auto bid users!`,
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
      user_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { user_entity_id } = req.body;

      const resp = await userService.delete(user_entity_id);

      return res.json(success("Successfully deleted user!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to delete user!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/forgot_email_password",
  celebrate({
    [Segments.BODY]: Joi.object({
      email: Joi.string().lowercase().trim().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { email } = req.body;

      const resp = await userService.forgotEmailPassword(email);

      return res.json(success("Successfully sent forgot password email!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to send forgot password email!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/change_forgot_password",
  celebrate({
    [Segments.HEADERS]: Joi.object({
      reset_token: Joi.string().required(),
    }).unknown(true),
    [Segments.BODY]: Joi.object({
      new_password: Joi.string().required(),
    }),
  }),
  verifyResetToken,
  async (req: any, res: Response) => {
    const logger = Container.get(Logger);

    try {
      const user = req.user; // From verifyResetToken middleware
      const { new_password } = req.body;
      const { reset_token } = req.headers;

      const resp = await userService.changeForgotPassword(user?.user_entity_id, new_password, reset_token);

      return res.json(success("Successfully changed password using reset link!", resp)).status(200).end();
    } catch (e) {
      logger.logger.error("🔥 error: %o", e);
      return res
        .json(
          failure({
            message: `Failed to change password using reset link!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/change_password",
  celebrate({
    [Segments.BODY]: Joi.object({
      new_password: Joi.string().required(),
    }),
  }),
  isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_token } = req;
      const { new_password } = body;

      const resp = await userService.changePassword(decoded_token, new_password);

      return res.json(success("Successfully changed your password!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to change your password!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/forgot_email_password_otp",
  celebrate({
    [Segments.BODY]: Joi.object({
      email: Joi.string().lowercase().trim().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { email } = req.body;

      const resp = await userService.forgotEmailPasswordOtp(email);

      return res.json(success("Successfully sent forgot password email!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to send forgot password email!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.post(
  "/change_forgot_password_otp",
  celebrate({
    [Segments.BODY]: Joi.object({
      email: Joi.string().lowercase().trim().required(),
      new_password: Joi.string().required(),
      otp: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { email, new_password, otp } = req.body;

      const resp = await userService.changeForgotPasswordOtp(email, new_password, otp);

      return res.json(success("Successfully changed password using OTP!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to change password using OTP!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.delete(
  "/deactivate_account",
  celebrate({
    [Segments.BODY]: Joi.object({
      user_entity_id: Joi.string().required(),
    }),
  }),
  isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_token } = req;
      const { user_entity_id } = body;

      console.log("decoded_token", decoded_token);

      const resp = await userService.deactivateAccount(user_entity_id, decoded_token);

      return res.json(success("Successfully deactivated account!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to deactivate account!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.patch(
  "/reactivate_account",
  celebrate({
    [Segments.BODY]: Joi.object({
      user_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { user_entity_id } = req.body;

      const resp = await userService.reactivateAccount(user_entity_id);

      return res.json(success("Successfully reactivated account!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to reactivate account!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.patch(
  "/admin_autogen_user_password",
  celebrate({
    [Segments.BODY]: Joi.object({
      user_entity_id: Joi.string().required(),
    }),
  }),
  isAuthorized,
  isAdmin,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_token } = req;
      const { user_entity_id } = body;

      const resp = await userService.adminAutoGenUserPassword(user_entity_id);

      return res.json(success("Successfully set user password!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to set user password!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as userRouter, userCelebrate };
