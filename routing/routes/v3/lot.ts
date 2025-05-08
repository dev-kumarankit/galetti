import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, attachCurrentUser, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Logger } from "../../../helpers/logger";
import { LOT_STATUSES, LOT_TYPES } from "../../../helpers/constants/lot_enums";
import { Container } from "typedi";
import { LotService3 } from "../../../services/v3/lot";

const router = Router();
const lotService = Container.get(LotService3);

const lotCelebrate = {
  title: Joi.string().required(),
  description: Joi.string().required(),
  broker_name: Joi.string().allow(null).optional(),
  starting_price: Joi.alternatives()
    .try(Joi.number(), Joi.string().allow(""))
    .default(0)
    .custom((value, helpers) => {
      if (value === "") {
        return 0;
      }
      return value;
    }),
  reserve_price: Joi.alternatives()
    .try(Joi.number(), Joi.string().allow(""))
    .default(0)
    .custom((value, helpers) => {
      if (value === "") {
        return 0;
      }
      return value;
    }),
  youtube_url: Joi.string().optional().allow(null, ""),
  status: Joi.string()
    .valid(...LOT_STATUSES)
    .required(),
  lot_number: Joi.number().optional().allow(null),
  location: Joi.object({
    full_address: Joi.string().required(),
    latitude: Joi.string().required(),
    longitude: Joi.string().required(),
  })
    .optional()
    .allow(null),
  vendor_bidding: Joi.object({
    enabled: Joi.boolean().required(),
    bid_increment: Joi.alternatives()
      .try(Joi.number(), Joi.string().allow(""))
      .default(0)
      .custom((value, helpers) => {
        if (value === "") {
          return 0;
        }
        return value;
      }),
    bid_limit: Joi.alternatives()
      .try(Joi.number(), Joi.string().allow(""))
      .default(0)
      .custom((value, helpers) => {
        if (value === "") {
          return 0;
        }
        return value;
      }),
    timeout: Joi.number().required(), // should be seconds
  })
    .optional()
    .allow(null),
  contacts: Joi.object({
    email: Joi.string().optional().allow(null, ""),
    phone: Joi.object({
      number: Joi.string().optional().allow(null, ""),
      country_code: Joi.string().required(),
      calling_code: Joi.string().required(),
    })
      .optional()
      .allow(null),
    whatsapp: Joi.object({
      number: Joi.string().optional().allow(null, ""),
      country_code: Joi.string().required(),
      calling_code: Joi.string().required(),
    })
      .optional()
      .allow(null),
  })
    .optional()
    .allow(null),
  extra_data: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().required(),
        value: Joi.string().required(),
      })
    )
    .optional()
    .allow(null),
};

router.post(
  "/create",
  celebrate({
    [Segments.BODY]: Joi.object({
      auction_entity_id: Joi.string().required(),
      broker_name: Joi.string().allow(null).optional(),
      ...lotCelebrate,
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const response = await lotService.createLot(body);
      return res
        .json(success("Successfully created a lot!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to create a lot!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.put(
  "/update",
  celebrate({
    [Segments.BODY]: Joi.object({
      entity_id: Joi.string().required(),
      entity: Joi.object({
        ...lotCelebrate,
      }).required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const response = await lotService.updateLot(body.entity_id, body.entity);
      return res
        .json(success("Successfully updated a lot!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to update a lot!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.get(
  "/get",
  celebrate({
    [Segments.QUERY]: Joi.object({
      // entity_ids: Joi.array().items(Joi.string()).required(),
      entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { entity_id } = req.query;

      const response = await lotService.getLot(entity_id);
      return res
        .json(success("Successfully fetched lot(s)!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to fetch lot(s)!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.get(
  "/lots_for_auction",
  celebrate({
    [Segments.QUERY]: Joi.object({
      auction_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { auction_entity_id } = req.query;

      const response = await lotService.lotsForAuction(auction_entity_id);
      return res
        .json(success("Successfully fetched all lots!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to fetch all lots!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.get(
  "/lots_with_bids",
  celebrate({
    [Segments.QUERY]: Joi.object({
      auction_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { auction_entity_id } = req.query;

      const response = await lotService.lotsWithBids(auction_entity_id);
      return res
        .json(success("Successfully fetched all lots with bids!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to fetch all lots with bids!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.delete(
  "/delete",
  celebrate({
    [Segments.BODY]: Joi.object({
      entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { entity_id } = req.body;

      const response = await lotService.deleteLot(entity_id);
      return res
        .json(success("Successfully deleted lot(s)!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to delete lot(s)!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.delete(
  "/delete_all",
  celebrate({
    [Segments.BODY]: Joi.object({
      auction_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { auction_entity_id } = req.body;

      const response = await lotService.deleteAllLots(auction_entity_id);
      return res
        .json(success("Successfully deleted all lots!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to delete all lots!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.patch(
  "/update_lot_numbers",
  celebrate({
    [Segments.BODY]: Joi.object({
      order: Joi.array()
        .items(
          Joi.object({
            lot_entity_id: Joi.string().required(),
            lot_number: Joi.number().required(),
          })
        )
        .required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { order } = req.body;

      const response = await lotService.updateLotsOrder(order);
      return res
        .json(success("Successfully updated lots order!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to update lots order!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.post(
  "/upload_csv",
  celebrate({
    [Segments.BODY]: Joi.object({
      auction_entity_id: Joi.string().required(),
      records: Joi.array()
        .items(
          Joi.object({
            lot_number: Joi.number().required(),
            title: Joi.string().required(),
            description: Joi.string().optional().allow(null, ""),
            extra_data: Joi.array().items(
              Joi.object({
                key: Joi.string().required(),
                value: Joi.string().required(),
              })
            ),
          })
        )
        .required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { auction_entity_id, records } = body;

      const response = await lotService.uploadCSV(auction_entity_id, records);
      return res
        .json(success("Successfully uploaded CSV lots!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to create a lot!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.get(
  "/get_csv_template", //
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      // const {} = req;

      const response = await lotService.getCSVTemplate();
      return res
        .json(success("Successfully retrieved a CSV Template!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to create a lot!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.post(
  "/manual_previous_current_next",
  celebrate({
    [Segments.BODY]: Joi.object({
      auction_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;

      const response = await lotService.manualPreviousCurrentNext(
        body.auction_entity_id
      );
      return res
        .json(
          success(
            "Successfully retrieved the previous, current & next lot!",
            response
          )
        )
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to retrieve the previous, current & next lot!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.post(
  "/manual_set_current",
  celebrate({
    [Segments.BODY]: Joi.object({
      auction_entity_id: Joi.string().required(),
      lot_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;

      const response = await lotService.manualSetCurrent(
        body.auction_entity_id,
        body.lot_entity_id
      );
      return res
        .json(success("Successfully set the current lot!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to set the current lot!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.put(
  "/manual_lot_status",
  celebrate({
    [Segments.BODY]: Joi.object({
      entity_id: Joi.string().required(),
      status: Joi.string()
        .valid(...LOT_STATUSES)
        .required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const response = await lotService.manualLotStatus(
        body.entity_id,
        body.status
      );
      return res
        .json(success("Successfully updated lot status manually!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to update lot status manually!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

export { router as lotRouter };
