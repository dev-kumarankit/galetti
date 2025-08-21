import moment from "moment-timezone";
// import { LotRepository, AutoBidRepository, BidRepository } from "../repositories";
import { BidRepository } from "../../schemas/redis/bid";
import { AutoBidRepository } from "../../schemas/redis/autobid";
import { LotRepository } from "../../schemas/redis/lot";
import { IBid } from "../../models/bid";
import { ABid } from "../../models/autobid";
import { BID_ACTIVE, BID_REJECTED } from "../../helpers/constants/bid_enums";
import ValidationError from "../../helpers/validation_error";
import { BidService3 } from "./../../../galetti/services/v3/bid";
import { Container } from "typedi";



export async function triggerAutoBidForLot(lotId: any, triggeringUserId: any | null = null) {
  const log = (msg: string, data?: any) => {
    const time = moment().format("YYYY-MM-DD HH:mm:ss");
    console.log(`[${time}] [AutoBid] ${msg}`, data ?? "");
  };

  const bidService = Container.get(BidService3);

  log("Function called with params", { lotId, triggeringUserId });

  const lot = await LotRepository.fetch(lotId);
  if (!lot || !lot.auction_entity_id) {
    log("Lot not found or missing auction_entity_id");
    throw new ValidationError("Lot not found!");
  }
  log("Fetched lot details", lot);

  const activeAutoBidders = await AutoBidRepository.search()
    .where("lot_entity_id").eq(lotId)
    .where("status").eq(true)
    .sortAscending("created_at")
    .return.all();
  log("Active auto-bidders found", activeAutoBidders.length);

  if (activeAutoBidders.length === 0) {
    log("No active auto-bidders — exiting function");
    return;
  }

  const highestBid = await BidRepository.search()
    .where("lot_entity_id").eq(lotId)
    .and("status").eq(BID_ACTIVE)
    .sortBy("amount", "DESC")
    .return.first();
  log("Current highest bid", highestBid);

  const currentHighestAmount = parseFloat(highestBid?.amount ?? lot.starting_price ?? 0);
  log("Current highest amount", currentHighestAmount);

  const eligibleBidders = activeAutoBidders.filter(bidder => {
    if (triggeringUserId && bidder.user_entity_id === triggeringUserId) {
      log("Skipping bidder (triggered this round)", bidder.user_entity_id);
      return false;
    }
    if (bidder.max_amount <= currentHighestAmount) {
      log("Skipping bidder (max amount too low)", { bidderId: bidder.user_entity_id, max_amount: bidder.max_amount });
      return false;
    }
    if (highestBid && highestBid.user_entity_id === bidder.user_entity_id) {
      log("Skipping bidder (already highest bidder)", bidder.user_entity_id);
      return false;
    }
    return true;
  });
  log("Eligible bidders after filtering", eligibleBidders.length);

  if (eligibleBidders.length === 0) {
    log("No eligible bidders — exiting function");
    return;
  }

  const nextBidder = eligibleBidders[0];
  let nextBidAmount = currentHighestAmount;

  if (!highestBid) {
    nextBidAmount = parseFloat(lot.starting_price) + parseFloat(nextBidder.increment_amount);
    log("No highest bid yet — starting bid calculation", nextBidAmount);
  } else {
    nextBidAmount = currentHighestAmount + nextBidder.increment_amount;
    if (nextBidAmount > nextBidder.max_amount) {
      nextBidAmount = nextBidder.max_amount;
    }
    log("Next bid calculated", nextBidAmount);
  }

  const autoBidObj: IBid = {
    lot_entity_id: lotId,
    user_entity_id: nextBidder.user_entity_id,
    amount: nextBidAmount,
    status: BID_ACTIVE,
    auction_id: lot.auction_entity_id,
    created_at: moment().tz("Africa/Johannesburg").unix(),
  };

  log("Placing auto-bid", autoBidObj);
  try {
     const response = await bidService.placeBid(autoBidObj);
  log("Bid placed successfully", response);

  if (eligibleBidders.length > 1) {
    log("Multiple bidders remain — scheduling next round");
    setTimeout(() => {
      log("Triggering next round", { lotId, excludingUser: nextBidder.user_entity_id });
      triggerAutoBidForLot(lotId, nextBidder.user_entity_id);
    }, 500);
  } else {
    log("Only one eligible bidder left — ending auto-bid loop");
  }
  } catch (error) {
    log("error",error);
  }
 
}
    