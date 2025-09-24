import { celebrate, Joi, Segments } from "celebrate";
import { Router, Response } from "express";
import { isAuthorized, attachCurrentUser, isAdmin } from "../../../middleware";
import { success } from "../../../helpers/responses/success";
import { failure } from "../../../helpers/responses/failure";
import { Container } from "typedi";
import { AUCTION_STATUSES, AUCTION_TYPES } from "../../../helpers/constants/auction_enums";
import { AuctionService3 } from "../../../services/v3/auction";
import { sendCustomEmail } from "../../../helpers/utils/send_email";
import { BidderService3 } from "../../../services/v3/bidder";
import { getBody } from "../../../emails/emailBodyUser";
import { UserRepository } from "../../../schemas/redis/user";
import { AuctionRepository } from "../../../schemas/redis/auction";
import moment from "moment";
const router = Router();
const auctionService = Container.get(AuctionService3);
const bidderService = Container.get(BidderService3);
const customJoi = Joi.extend((joi) => ({
  type: "isoDateTime",
  base: joi.string(),
  messages: {
    "isoDateTime.base": "{{#label}} must be a valid ISO 8601 date with time and timezone",
  },
  validate(value, helpers) {
    // Regular expression to match ISO 8601 date with time and timezone
    const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
    if (!isoDateTimeRegex.test(value)) {
      return { value, errors: helpers.error("isoDateTime.base") };
    }
  },
}));

const auctionCelebrate = {
  title: Joi.string().required(),
  description: Joi.string().required(),
  status: Joi.string()
  .valid(...AUCTION_STATUSES)
  .required(),
  type: Joi.string()
  .valid(...AUCTION_TYPES)
  .required(),
  date_from: customJoi.isoDateTime().required(),
  date_to: customJoi.isoDateTime().required(),
  is_popular: Joi.boolean().optional().default(false),
  is_top_auction: Joi.boolean().optional().default(false),
  registration_fee: Joi.number().default(0).allow(null, "").empty("").optional(),
  youtube_url: Joi.string().optional().allow(null, ""),
  automated: Joi.object({
    enabled: Joi.boolean().required(),
    soft_closing: Joi.object({
      enabled: Joi.boolean().required(),
      // tieout required if enabled is true
      timeout: Joi.number().when("enabled", {
        is: true,
        then: Joi.number().required(),
        otherwise: Joi.number().optional().allow(null),
      }),
    }).optional(),
  }).required(),
  
  // DEPRECATED! kept for existing app to not crash. use `contact_details` below instead
  contacts: Joi.object({
    // DEPRECATED!
    cell_number: Joi.string().required(),
    // DEPRECATED!
    email: Joi.string().optional().allow(null, ""),
    // DEPRECATED!
    whatsapp: Joi.string().required(),
    // DEPRECATED!
  }).optional(),
  
  contact_details: Joi.object({
    email: Joi.string().required(),
    phone: Joi.object({
      number: Joi.string().required(),
      country_code: Joi.string().required(),
      calling_code: Joi.string().required(),
    }).required(),
    whatsapp: Joi.object({
      number: Joi.string().required(),
      country_code: Joi.string().required(),
      calling_code: Joi.string().required(),
    }).required(),
  }).required(),
  location: Joi.object({
    full_address: Joi.string().required(),
    latitude: Joi.string().required(),
    longitude: Joi.string().required(),
  })
  .optional()
  .allow(null),
};

router.post(
  "/create",
  celebrate({
    [Segments.BODY]: Joi.object({
      client_entity_id: Joi.string().required(),
      ...auctionCelebrate,
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const response = await auctionService.createAuction(body);
      return res.json(success("Successfully created an auction!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
      .json(
        failure({
          message: "Failed to create an auction!",
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
      entity_id: Joi.string().required(),
      user_entity_id: Joi.string(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      const { entity_id, user_entity_id } = query;
      const response = await auctionService.get({ entity_id, user_entity_id });
      return res.json(success("Successfully retrieved auction!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
      .json(
        failure({
          message: "Failed to retrieve auction!",
          e,
        }),
      )
      .status(400)
      .end();
    }
  },
);

router.put(
  "/update",
  celebrate({
    [Segments.BODY]: Joi.object({
      entity_id: Joi.string().required(),
      entity: Joi.object({
        ...auctionCelebrate,
      }).required(),
    }),
  }),
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const response = await auctionService.update(body.entity_id, body.entity);
      return res.json(success("Successfully updated auction!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
      .json(
        failure({
          message: "Failed to update auction!",
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
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      const { entity_id } = body;
      const response = await auctionService.delete(entity_id);
      return res.json(success("Successfully deleted auction!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
      .json(
        failure({
          message: "Failed to delete auction!",
          e,
        }),
      )
      .status(400)
      .end();
    }
  },
);

router.get(
  "/auctions_for_client",
  celebrate({
    [Segments.QUERY]: Joi.object({
      entity_id: Joi.string().required(),
      user_entity_id: Joi.string().allow("").optional(),
    }),
  }),
  
  // isAuthorized,
  // isAdmin,
  // attachCurrentUser,
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      
      const response = await auctionService.auctionsForClient(query);
      return res.json(success("Successfully retrieved all auctions!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
      .json(
        failure({
          message: "Failed to retrieve all auctions!",
          e,
        }),
      )
      .status(400)
      .end();
    }
  },
);

router.get(
  "/remaining_time",
  celebrate({
    [Segments.QUERY]: Joi.object({
      auction_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      
      const response = await auctionService.remainingTime(query.auction_entity_id);
      return res.json(success("Successfully retrieved auction's remaining time!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
      .json(
        failure({
          message: "Failed to retrieve auction's remaining time!",
          e,
        }),
      )
      .status(400)
      .end();
    }
  },
);

router.get(
  "/has_extended_lots",
  celebrate({
    [Segments.QUERY]: Joi.object({
      entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      
      const response = await auctionService.hasExtendedLots(query.entity_id);
      return res.json(success("Successfully determined if the auction has extended lots!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
      .json(
        failure({
          message: "Failed to determine if the auction has extended lots!",
          e,
        }),
      )
      .status(400)
      .end();
    }
  },
);

/**
* @deprecated !!!!! do not use "first_live_auction" any longer use "extended_auctions" instead
**/
router.get(
  "/first_live_auction",
  celebrate({
    [Segments.QUERY]: Joi.object({
      client_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      
      const response = await auctionService.firstLiveAuction(query.client_entity_id);
      return res.json(success("Successfully retrieved the first live auction!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
      .json(
        failure({
          message: "Failed to retrieve the first live auction!",
          e,
        }),
      )
      .status(400)
      .end();
    }
  },
);

router.get(
  "/extended_auctions",
  celebrate({
    [Segments.QUERY]: Joi.object({
      client_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { query, user_details } = req;
      
      const response = await auctionService.extendedAuctions(query.client_entity_id);
      return res.json(success("Successfully retrieved extended auctions!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
      .json(
        failure({
          message: "Failed to retrieve extended auctions!",
          e,
        }),
      )
      .status(400)
      .end();
    }
  },
);

router.post(
  "/manual_start",
  celebrate({
    [Segments.BODY]: Joi.object({
      auction_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      
      const response = await auctionService.manualStart(body.auction_entity_id);
      return res.json(success("Successfully manually set the auction to live!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
      .json(
        failure({
          message: "Failed to manually set the auction to live!",
          e,
        }),
      )
      .status(400)
      .end();
    }
  },
);

router.post(
  "/manual_end",
  celebrate({
    [Segments.BODY]: Joi.object({
      auction_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { body, user_details } = req;
      
      const response = await auctionService.manualEnd(body.auction_entity_id);
      return res.json(success("Successfully manually set the auction to complete!", response)).status(200).end();
    } catch (e) {
      console.error("🔥 error:", e);
      return res
      .json(
        failure({
          message: "Failed to manually set the auction to complete!",
          e,
        }),
      )
      .status(400)
      .end();
    }
  },
);


router.post(
  "/send_email",
  celebrate({
    [Segments.BODY]: Joi.object({
      auction_entity_id: Joi.string().required(),
      client_entity_id: Joi.string().required(),
      email_from: Joi.string().required(),
      email_from_name: Joi.string().required(),
      email_reply_to: Joi.string().required(),
      email_subject: Joi.string().required(),
      email_msg: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      // const { auction_entity_id,client_entity_id, email_from, ,email_reply_to,email_subject,email_msg } = req;
      const { body } = req;
      const bidders = await bidderService.biddersForClient(
        {client_entity_id: body.client_entity_id,
          auction_entity_id: body.auction_entity_id}, true
        );
        let personalizations:any = await Promise.all(
          bidders.map(async (bidder) => {
            // Fetch user + auction data for this bidder
            const [user, auctionData] = await Promise.all([
              UserRepository.fetch(bidder?.user_entity_id),
              AuctionRepository.fetch(bidder?.registered_auction_id),
            ]);
            
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
              email:auctionData?.contact_details?.email,
              email_msg:body?.email_msg
            };
            // Generate HTML using your template function
            const templateHtml = await getBody(emailData, "customEmail");
            
            return {
              to: [{ email: user?.email|| bidder.email }],
              subject: body?.email_subject,
              html: templateHtml, // Send raw HTML instead of SendGrid dynamic template
              email_reply_to:body?.email_reply_to,
              email_subject:body?.email_subject,
              from_name:body?.email_from_name,
              email_from:body?.email_from,
            };
          })
          
        );
       
        let options: any = {
          // email_reply_to: body?.email_reply_to,
          email_reply_to: body?.email_reply_to,
          email_subject: body?.email_subject,
          from_name: body?.email_from_name,
          email_from: body?.email_from,
          personalizations: personalizations
        };
        
        let respo =   await sendCustomEmail(options)
        return res.json(success("Email Sent Successfully", {personalizations})).status(200).end();
      } catch (e) {
        console.error("🔥 error:", e);
        return res
        .json(
          failure({
            message: "Failed to Send Email!",
            e,
          }),
        )
        .status(400)
        .end();
      }
    },
  );


  router.post(
  "/save_tutorial",
  celebrate({
    [Segments.BODY]: Joi.object({
      url: Joi.string().required(),
       client_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      const { body } = req;
      const tutorial = await auctionService.saveUrl(body.url,body.client_entity_id);
        return res.json(success("Url Saved Successfully", tutorial)).status(200).end();
      } catch (e) {
        console.error("🔥 error:", e);
        return res
        .json(
          failure({
            message: "Failed to save url!",
            e,
          }),
        )
        .status(400)
        .end();
      }
    },
  );

    router.get(
  "/get_tutorial",
   celebrate({
    [Segments.QUERY]: Joi.object({
      client_entity_id: Joi.string().required(),
    }),
  }),
  async (req: any, res: Response) => {
    try {
      console.log("reqreqreq",req.query.client_entity_id)
       const {client_entity_id} = req?.query;

      const auvtionUrl = await auctionService.getUrl(client_entity_id);
        return res.json(success("Url fetched Successfully", auvtionUrl)).status(200).end();
      } catch (e) {
        console.error("🔥 error:", e);
        return res
        .json(
          failure({
            message: "Failed to Fetch url!",
            e,
          }),
        )
        .status(400)
        .end();
      }
    },
  );
  export { router as auctionRouter };
  