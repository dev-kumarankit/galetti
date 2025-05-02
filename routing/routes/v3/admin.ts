import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Container } from "typedi";
import { AdminService3 } from "../../../services/v3/admin";

const router = Router();

const adminService = Container.get(AdminService3);

router.post(
  "/create",
  celebrate({
    [Segments.BODY]: Joi.object({
      name: Joi.string().required(),
      surname: Joi.string().required(),
      email: Joi.string().required(),
      password: Joi.string().required(),
      role: Joi.string().valid("admin", "super_admin").required(),
      client_entity_id: Joi.string().when("role", {
        is: "admin",
        then: Joi.required(),
        otherwise: Joi.forbidden().strip(),
      }),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const resp = await adminService.create(req.body);

      return res.json(success("Successfully created admin user!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to create admin user!`,
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
      email: Joi.string().required(),
      password: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { email, password } = req.body;

      const resp = await adminService.logIn(email, password);

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

router.patch(
  "/change_password",
  celebrate({
    [Segments.BODY]: Joi.object({
      new_password: Joi.string().required(),
    }),
  }),
  isAuthorized,
  isAdmin,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_token } = req;
      const { new_password } = body;

      const resp = await adminService.changePassword(decoded_token, new_password);

      return res.json(success("Successfully changed password!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to change password!`,
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
      entity_id: Joi.string().required(),
    }),
  }),
  isAuthorized,
  isAdmin,
  async (req: any, res: Response) => {
    try {
      const { body, decoded_token } = req;
      const { entity_id } = body;

      await adminService.delete(entity_id);

      return res.json(success("Successfully deleted admin user!")).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to delete admin user!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

router.get(
  "/admins_for_client",
  celebrate({
    [Segments.QUERY]: Joi.object({
      entity_id: Joi.string().required(),
    }),
  }),
  isAuthorized,
  isAdmin,
  async (req: any, res: Response) => {
    try {
      const { query, decoded_token } = req;
      const { entity_id } = query;

      const resp = await adminService.adminsForClient(entity_id);

      return res.json(success("Successfully fetched admins for client!", resp)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: `Failed to fetch admins for client!`,
            e,
          }),
        )
        .status(400)
        .end();
    }
  },
);

export { router as adminRouter };
