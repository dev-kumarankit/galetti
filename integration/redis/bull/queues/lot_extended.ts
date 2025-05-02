import Bull from "bull";
import { getRedisUrl } from "../../../../integration/redis/redis";
import { AuctionRepository } from "../../../../schemas/redis/auction";
import { AUCTION_IN_PROGRESS } from "../../../../helpers/constants/auction_enums";
import Container from "typedi";
import { RealTimeCommunication } from "../../../../helpers/real_time_communication";
import moment from "moment";
import { LotRepository } from "../../../../schemas/redis/lot";
import { EntityId } from "redis-om";
import { BidRepository } from "../../../../schemas/redis/bid";
import { BID_ACTIVE } from "../../../../helpers/constants/bid_enums";
import { LOT_SOLD } from "../../../../helpers/constants/lot_enums";

export const extended_lot_queue = new Bull(`LOT_EXTENDED`, getRedisUrl(), {
  redis: {
    keyPrefix: "BULL",
    password: process.env.REDIS_PASSWORD,
  },
});

extended_lot_queue.process(async (job) => {
  const { data } = job;
  const { lot_entity_id } = data;
  const rtc_di = Container.get(RealTimeCommunication);

  job.finished().then(() => {
    console.log("Cleaning up extended lot job.");
    job.remove(); // clean up redis
  });

  LotRepository.fetch(lot_entity_id).then(async (lot) => {
    if (lot.auction_entity_id) {
      // Note, if we are here in the code, it means that there is 100% a bid that has been placed on this lot.
      // If the latest bid has not been placed within the soft_closing.timeout timeframe, we need to set the lot to SOLD.
      // If the latest bid has been placed within the soft_closing.timeout timeframe, we need to extend the lot once again.

      const auction: any = await AuctionRepository.fetch(lot.auction_entity_id.toString());

      const latestBidForLot = await BidRepository.search() //
        .where("lot_entity_id")
        .eq(lot[EntityId])
        .and("status")
        .eq(BID_ACTIVE)
        .sortBy("created_at", "DESC")
        .return.first();

      if (latestBidForLot) {
        const now = moment();
        const latestBidDate = moment(new Date(latestBidForLot.created_at.toString()));
        const diff = now.diff(latestBidDate, "milliseconds");

        console.log("latestBidDate", latestBidDate);
        console.log("now", now);
        console.log("diff ms", diff);

        if (diff < moment.duration(auction.automated.soft_closing.timeout, "seconds").asMilliseconds()) {
          // extend the lot once again
          console.log("Extending lot once again", lot_entity_id);

          // const jobs = await extended_lot_queue.getJobs(["waiting", "delayed"]);
          // const existingJob = jobs.find((job) => job.data.lot_entity_id === lot_entity_id);
          // if (existingJob) {
          //   await existingJob.remove();
          // }

          extended_lot_queue.add(
            {
              lot_entity_id: lot_entity_id,
            },
            {
              delay: moment.duration(auction.automated.soft_closing.timeout, "seconds").asMilliseconds(),
            },
          );

          rtc_di.broadcastLotExtended(lot_entity_id, {
            lot: {
              entity_id: lot_entity_id,
              title: lot.title.toString(),
              lot_number: lot.lot_number.toString(),
            },
          });
        } else {
          console.log("Lot has not been bid on within the soft closing timeout, it will now be set to SOLD.");
          // We need to set the lot to SOLD.
          await LotRepository.save(lot_entity_id, {
            ...lot,
            status: LOT_SOLD,
          });

          console.log("Lot set to SOLD", lot_entity_id);

          // rtc_di.broadcastLotStatus(lot_entity_id, {
          rtc_di.broadcastLotStatusForAuction(auction[EntityId], {
            lot_entity_id: lot_entity_id,
            lot_number: parseInt(lot.lot_number.toString()),
            auction_entity_id: lot.auction_entity_id.toString(),
            title: lot.title.toString(),
            status: LOT_SOLD,
            type: lot.type.toString(),
            highest_bid: latestBidForLot,
          });
        }
      } else {
        console.log("Failed to find latest bid for lot to process EXTENDED job.", lot_entity_id);
        console.log("Since there are no bids, logically the lot cannot be extended.");
      }
    } else {
      console.log("Failed to find lot to process EXTENDED job");
    }
  });
});
