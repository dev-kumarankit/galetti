import Bull from "bull";
import { getRedisUrl } from "../../redis";
import { AuctionRepository } from "../../../../schemas/redis/auction";
import { AUCTION_IN_PROGRESS } from "../../../../helpers/constants/auction_enums";
import Container from "typedi";
import { RealTimeCommunication } from "../../../../helpers/real_time_communication";
import moment from "moment";
import { LotRepository } from "../../../../schemas/redis/lot";
import { ILot } from "../../../../models/lot";
import { BidRepository } from "../../../../schemas/redis/bid";
import { IBid } from "../../../../models/bid";
import { BID_ACTIVE } from "../../../../helpers/constants/bid_enums";
import { EntityId } from "redis-om";
import { getRandomVendorUser, isVendorUser } from "../../../../config/floor_entities";
import { FirebaseService3 } from "../../../../services/v3/firebase";

export const vendor_bidding_queue = new Bull(`VENDOR_BIDDING`, getRedisUrl(), {
  redis: {
    keyPrefix: "BULL",
    password: process.env.REDIS_PASSWORD,
  },
});

vendor_bidding_queue.process(async (job) => {
  const { data } = job;
  const { lot_entity_id } = data;
  const rtc_di = Container.get(RealTimeCommunication);

  job.finished().then(() => {
    console.log("Cleaning up vendor bidding job.");
    job.remove(); // clean up redis
  });

  // get the lot we are working with
  const lot: any = await LotRepository.fetch(lot_entity_id);

  if (lot.auction_entity_id) {
    const auction: any = await AuctionRepository.fetch(lot.auction_entity_id.toString());

    // Can only do vendor bidding while the auction is in progress.
    if (auction.status !== AUCTION_IN_PROGRESS) {
      console.log(`Vendor bidding will not continue because the auction is no longer ${AUCTION_IN_PROGRESS}.`);
      return;
    }
    // // We should also make sure that we dont try to place bids 10 seconds before the auction ends.
    // const auction_date_to = moment.unix(auction.date_to);
    // const now = moment().tz("Africa/Johannesburg");
    // const diff = auction_date_to.diff(now, "seconds");
    // if (diff < 10) {
    //   console.log("Vendor bidding will not continue because the auction is about to end in less than 10 seconds.");
    //   return;
    // }

    const bid_increment = parseFloat(lot.vendor_bidding.bid_increment.toString());
    const bid_limit = parseFloat(lot.vendor_bidding.bid_limit.toString());
    const bid_timeout = lot.vendor_bidding.timeout;

    // Only place a bid if the last_bid.amount is not > the vendor_bidding.bid_limit
    const last_bid = await BidRepository.search() //
      .where("lot_entity_id")
      .eq(lot_entity_id)
      .and("status")
      .eq(BID_ACTIVE)
      .sortBy("created_at", "DESC")
      .return.first();

    // the vendor cannot bid against itself. if the last bid was placed by the vendor, we should not place another bid.
    // however bull must stull queue the job for next time to check.
    if (isVendorUser(last_bid?.user_entity_id.toString())) {
      console.log(`Vendor cannot bid against itself. Will try again after`, bid_timeout, "seconds.");

      vendor_bidding_queue.add(
        {
          lot_entity_id: lot_entity_id,
        },
        {
          delay: moment.duration(bid_timeout, "seconds").asMilliseconds(),
        },
      );

      return;
    }

    // if (last_bid && parseFloat(last_bid.amount.toString()) < bid_limit) {
    const lastBidAmount = parseFloat((last_bid?.amount ?? 0).toString());

    if (lastBidAmount < bid_limit) {
      const vendor_user = getRandomVendorUser();

      // place a FLOOR user bid
      const bid: IBid = {
        lot_entity_id: lot_entity_id,
        user_entity_id: vendor_user.entity_id,
        amount: lastBidAmount + bid_increment,
        status: BID_ACTIVE,
        created_at: moment().tz("Africa/Johannesburg").unix(),
      };

      console.log("Vendor is placing a bid", bid);

      const b = await BidRepository.save(bid);

      const bidCount = await BidRepository.search() //
        .where("lot_entity_id")
        .eq(bid.lot_entity_id)
        .and("status")
        .eq(BID_ACTIVE)
        .count();

      const firebaseService = Container.get(FirebaseService3);
      firebaseService.sendNotificationToUsers(
        {
          notification: {
            title: "Outbid!",
            body: `You have been outbid on lot #${lot.lot_number} - ${lot.title}`,
          },
        },
        [last_bid?.user_entity_id.toString()],
      );

      const obp = {
        count: bidCount,
        bid: {
          entity_id: b[EntityId],
          amount: b.amount,
          created_at: b.created_at,
          status: b.status,
          user: {
            entity_id: vendor_user.entity_id,
            name: vendor_user.name,
            surname: vendor_user.surname,
          },
          bidder: {
            entity_id: vendor_user.entity_id,
            paddle_number: vendor_user.paddle_number,
            is_verified: true,
          },
          lot: {
            entity_id: lot[EntityId],
            lot_number: lot.lot_number,
            title: lot.title,
          },
        },
      };

      // broadcast the bid to the lot
      // rtc_di.broadcastNewBid(bid.lot_entity_id, obp);
      rtc_di.broadcastNewBid(auction[EntityId], obp);

      // If the bid we placed is still less than the bid_limit, create another job
      if (bid.amount < bid_limit) {
        vendor_bidding_queue.add(
          {
            lot_entity_id: lot_entity_id,
          },
          {
            delay: moment.duration(bid_timeout, "seconds").asMilliseconds(),
          },
        );
      }
    } else {
      console.log("Bid limit reached, no more vendor bidding for this lot.");
    }
  } else {
    console.log("Vendor bidding will not continue because the lot could not be found!");
  }
});
