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
import {} from "../../../../config/floor_entities";

export const bidder_bidding_queue = new Bull(`BIDDER_BIDDING`, getRedisUrl(), {
  redis: {
    keyPrefix: "BULL",
    password: process.env.REDIS_PASSWORD,
  },
});

bidder_bidding_queue.process(async (job) => {
  const { data } = job;
  const { lot_entity_id } = data;
  const rtc_di = Container.get(RealTimeCommunication);

  job.finished().then(() => {
    console.log("Cleaning up vendor bidding job.");
    job.remove(); // clean up redis
  });

  // // rtc_di.broadcastNewBid(auction.lot_entity_id, obp); // Dont use this, use the one below.
  // rtc_di.broadcastNewBid(auction[EntityId], obp);
});
