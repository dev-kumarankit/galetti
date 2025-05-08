import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, attachCurrentUser, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Logger } from "../../../helpers/logger";
import { LOT_STATUSES, LOT_TYPES } from "../../../helpers/constants/lot_enums";
import { Container } from "typedi";
import { LotService3 } from "../../../services/v3/lot";
import { BidService3 } from "../../../services/v3/bid";
import { BID_STATUSES } from "../../../helpers/constants/bid_enums";
import { BidderService3 } from "../../../services/v3/bidder";
import { sendEmail } from "../../../helpers/utils/send_email";
import { getBody } from "../../../emails/emailBodyUser";
import moment from "moment";
import { AuctionRepository } from "../../../schemas/redis/auction";
import { UserRepository } from "../../../schemas/redis/user";

const router = Router();
const bidderService = Container.get(BidderService3);

router.post(
  "/register",
  celebrate({
    [Segments.BODY]: Joi.object({
      id_number: Joi.string().required(),
      address: Joi.string().required(),
      auction_id: Joi.string().optional(),
      bidder: Joi.object({
        client_entity_id: Joi.string().required(),
        user_entity_id: Joi.string().required(),
        registered_auction_id: Joi.string().required().optional().allow(null),
      }).required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { id_number, address, bidder } = body;
      const response = await bidderService.register(id_number, address, bidder);
      if (
        response &&
        bidder?.client_entity_id == "01J7KQPJ3D8CB000FM549T5ZC5"
      ) {
        const [user, auctionData] = await Promise.all([
          UserRepository.fetch(bidder?.user_entity_id),
          AuctionRepository.fetch(bidder?.registered_auction_id),
          // ClientRepository.fetch(data?.client_entity_id),
        ]);

        if (auctionData) {
          const emailData = {
            bidderName: `${user?.name} ${user?.surname}`,
            bidderEmail: user?.email,
            bidderPhoneNumber: `${user?.cell_phone?.calling_code} ${user?.cell_phone?.number}`,
            actionHouseName: auctionData?.title,
            lotNumber: "",
            actioneerName: auctionData?.title,
            auctionId: bidder?.registered_auction_id,
            actioneeDateAndTime: `${moment(auctionData?.date_from).format(
              "Do MMM YYYY, h:mm A"
            )} - ${moment(auctionData?.date_to).format("Do MMM YYYY, h:mm A")}`,
            actioneeLotNumber: "",
            bidderNumber: "",
          };

          try {
            const [template, templateAuction] = await Promise.all([
              getBody(emailData, "getWelcomeUserTemplateBody"),
              getBody(emailData, "getBidderDetailsTemplateBody"),
            ]);

            await Promise.all([
              sendEmail({
                to: user?.email,
                subject: "Welcome to Galetti",
                body: template,
              }),
              sendEmail({
                to: auctionData?.contact_details?.email,
                subject: "New User Added",
                body: templateAuction,
              }),
            ]);
          } catch (error) {
            console.error("Error sending emails:", error.message);
          }
        }
      }
      return res
        .json(success("Successfully registered bidder!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to register bidder!",
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
      id_number: Joi.string().required(),
      address: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { entity_id, id_number, address } = body;
      const response = await bidderService.update(
        entity_id,
        id_number,
        address
      );
      return res
        .json(success("Successfully updated bidder!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to update bidder!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.put(
  "/verification",
  celebrate({
    [Segments.BODY]: Joi.object({
      entity_id: Joi.string().required(),
      verified: Joi.bool().required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { entity_id, verified } = body;
      const response = await bidderService.verification(entity_id, verified);
      return res
        .json(
          success(
            `Successfully ${verified ? "verified" : "un-verified"} bidder!`,
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
            message: "Failed to verify/un-verify bidder!",
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
      bidder_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { bidder_entity_id } = body;
      const response = await bidderService.delete(bidder_entity_id);
      return res
        .json(success("Successfully deleted the bidder!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to delete the bidder!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.delete(
  "/delete_all_bidders",
  celebrate({
    [Segments.BODY]: Joi.object({
      client_entity_id: Joi.string().required(),
    }),
  }),
  isAuthorized,
  isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { client_entity_id } = body;
      const response = await bidderService.deleteAllBidders(client_entity_id);
      return res
        .json(
          success("Successfully deleted all bidders for the client!", response)
        )
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to delete all bidders for the client!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.put(
  "/unverify_all_bidders",
  celebrate({
    [Segments.BODY]: Joi.object({
      client_entity_id: Joi.string().required(),
    }),
  }),
  isAuthorized,
  isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { client_entity_id } = body;
      const response = await bidderService.unverifyAllBidders(client_entity_id);
      return res
        .json(
          success(
            "Successfully un-verified all bidders for the client!",
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
            message: "Failed to un-verify all bidders for the client!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.get(
  "/bidders_for_client",
  celebrate({
    [Segments.QUERY]: Joi.object({
      client_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      const { client_entity_id, auction_entity_id } = query;
      const response = await bidderService.biddersForClient({
        client_entity_id: client_entity_id,
        auction_entity_id: auction_entity_id,
      });
      return res
        .json(success("Successfully fetched bidders for client!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to fetch bidders for client!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.get(
  "/unregistered_bidders_for_client",
  celebrate({
    [Segments.QUERY]: Joi.object({
      client_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      const { client_entity_id } = query;
      const response = await bidderService.unregisteredBiddersForClient(
        client_entity_id
      );
      return res
        .json(
          success(
            "Successfully fetched unregistered bidders for client!",
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
            message: "Failed to fetch unregistered bidders for client!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.patch(
  "/regenerate_paddle_number",
  celebrate({
    [Segments.BODY]: Joi.object({
      bidder_entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { bidder_entity_id } = req.body;
      const response = await bidderService.regeneratePaddleNumber(
        bidder_entity_id
      );
      return res
        .json(success("Successfully regenerated paddle number!", response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to regenerate paddle number!",
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
      entity_id: Joi.string().required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      const { entity_id } = query;
      const response = await bidderService.get(entity_id);
      return res
        .json(success(`Successfully retrieved bidder!`, response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to retrieve bidder!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.get(
  "/status",
  celebrate({
    [Segments.QUERY]: Joi.object({
      client_entity_id: Joi.string().required(),
      user_entity_id: Joi.string().required(),
      auction_entity_id: Joi.string().allow("").optional(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { query } = req;
      const { client_entity_id, user_entity_id, auction_entity_id } = query;
      const response = await bidderService.status({
        client_entity_id,
        user_entity_id,
        auction_entity_id,
      });
      return res
        .json(success(`Successfully fetched bidder status!`, response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to fetch bidder status!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

router.get(
  "/active_bidders_for_lot",
  celebrate({
    [Segments.QUERY]: Joi.object({
      lot_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { query } = req;
      const { lot_entity_id } = query;
      const response = await bidderService.activeBiddersForLot(lot_entity_id);
      return res
        .json(success(`Successfully fetched active bidders for lot!`, response))
        .status(200)
        .end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
        .json(
          failure({
            message: "Failed to fetch active bidders for lot!",
            e,
          })
        )
        .status(400)
        .end();
    }
  }
);

export { router as bidderRouter };
