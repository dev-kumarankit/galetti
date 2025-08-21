import moment from "moment-timezone";
import { BidRepository } from "../../schemas/redis/bid";
import { AutoBidRepository } from "../../schemas/redis/autobid";
import { LotRepository } from "../../schemas/redis/lot";
import { IBid } from "../../models/bid";
import { BID_ACTIVE } from "../../helpers/constants/bid_enums";
import ValidationError from "../../helpers/validation_error";
import { BidService3 } from "../v3/bid";
import { Container } from "typedi";

export async function triggerAutoBidForLot(lotId: any, triggeringUserId: any | null = null) {
  const log = (msg: string, data?: any) => {
    const time = moment().format("YYYY-MM-DD HH:mm:ss");
  };
  const bidService = Container.get(BidService3);
  const lot = await LotRepository.fetch(lotId);
  if (!lot || !lot.auction_entity_id) {
    throw new ValidationError("Lot not found!");
  }
  const activeAutoBidders = await AutoBidRepository.search()
    .where("lot_entity_id").eq(lotId)
    .where("status").eq(true)
    .sortAscending("created_at")
    .return.all();

  if (activeAutoBidders.length === 0) {
    return;
  }

  const highestBid = await BidRepository.search()
    .where("lot_entity_id").eq(lotId)
    .and("status").eq(BID_ACTIVE)
    .sortBy("amount", "DESC")
    .return.first();

  const currentHighestAmount = parseFloat(highestBid?.amount ?? lot.starting_price ?? 0);

  const eligibleBidders = activeAutoBidders.filter(bidder => {
    if (triggeringUserId && bidder.user_entity_id === triggeringUserId) {
      return false;
    }
    if (bidder.max_amount <= currentHighestAmount) {
      return false;
    }
    if (highestBid && highestBid.user_entity_id === bidder.user_entity_id) {
      return false;
    }
    return true;
  });

  if (eligibleBidders.length === 0) {
    return;
  }

  const nextBidder :any = eligibleBidders[0];
  let nextBidAmount = currentHighestAmount;

  if (!highestBid) {
    nextBidAmount = parseFloat(lot.starting_price) + parseFloat(nextBidder.increment_amount);
  } else {
    nextBidAmount = currentHighestAmount + nextBidder.increment_amount;
    if (nextBidAmount > nextBidder.max_amount) {
      nextBidAmount = nextBidder.max_amount;
    }
  }

  const autoBidObj: IBid = {
    lot_entity_id: lotId,
    user_entity_id: nextBidder.user_entity_id,
    amount: nextBidAmount,
    status: BID_ACTIVE,
    auction_id: lot.auction_entity_id,
    created_at: moment().tz("Africa/Johannesburg").unix(),
  };

  try {
     const response = await bidService.placeBid(autoBidObj);
  if (eligibleBidders.length > 1) {
    setTimeout(() => {
      triggerAutoBidForLot(lotId, nextBidder.user_entity_id);
    }, 500);
  } else {
  }
  } catch (error) {
    log("error",error);
  }
}
    