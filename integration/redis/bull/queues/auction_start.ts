import Bull from "bull";
import { getRedisUrl } from "../../redis";
import { AuctionRepository } from "../../../../schemas/redis/auction";
import { AUCTION_IN_PROGRESS } from "../../../../helpers/constants/auction_enums";
import Container from "typedi";
import { RealTimeCommunication } from "../../../../helpers/real_time_communication";
import { auction_end_queue } from "./auction_end";
import moment from "moment";
import { LotRepository } from "../../../../schemas/redis/lot";
import { EntityId } from "redis-om";
import { LOT_BIDDING_OPEN } from "../../../../helpers/constants/lot_enums";
import { vendor_bidding_queue } from "./vendor_bidding";
import { ILot } from "../../../../models/lot";
import { FirebaseService3 } from "../../../../services/v3/firebase";

export const auction_start_queue = new Bull(`AUCTION_START`, getRedisUrl(), {
  redis: {
    keyPrefix: "BULL",
    password: process.env.REDIS_PASSWORD,
  },
});

auction_start_queue.process(async (job) => {
  const { data } = job;
  const { auction_entity_id } = data;
  const rtc_di = Container.get(RealTimeCommunication);
  const firebaseService = Container.get(FirebaseService3);

  AuctionRepository.fetch(auction_entity_id).then(async (auction) => {
    if (auction.client_entity_id) {
      // update the auction status to in progress
      await AuctionRepository.save(auction_entity_id, {
        ...auction,
        status: AUCTION_IN_PROGRESS,
      });

      // set all the lots to open for bidding
      const lots = await LotRepository.search() //
        .where("auction_entity_id")
        .eq(auction_entity_id)
        .return.all();

      lots.forEach(async (lot: ILot) => {
        await LotRepository.save(lot[EntityId], {
          ...lot,
          status: LOT_BIDDING_OPEN,
        });

        // No need to broadcast lot statuses?

        if (lot.vendor_bidding?.enabled && lot.vendor_bidding?.timeout > 0) {
          console.log("Creating job for lot vendor bidding", lot[EntityId]);

          vendor_bidding_queue.add(
            {
              lot_entity_id: lot[EntityId],
            },
            {
              delay: moment.duration(lot.vendor_bidding.timeout, "seconds").asMilliseconds(),
            },
          );
        }
      });

      rtc_di.broadcastAuctionWentLive(auction.client_entity_id.toString(), {
        entity_id: auction_entity_id,
        title: auction.title.toString(),
        description: auction.description.toString(),
        status: AUCTION_IN_PROGRESS,
        type: auction.type.toString(),
      });

      // firebaseService.sendNotificationToEveryone({
      //   notification: {
      //     title: "Auction Started",
      //     body: `Auction ${auction.title} has started!`,
      //   },
      // });

      console.log("Auction started", auction_entity_id);

      job.finished().then(() => {
        console.log("Auction start job has finished, cleaning up.");
        job.remove(); // clean up redis
      });

      // const now = moment().utc().local();
      // const auction_end_time = moment(new Date(auction.date_to.toString())).utc().local(true);
      const now = moment();
      // const auction_end_time = moment(new Date(auction.date_to.toString()));
      const auction_end_time = moment(auction.date_to.toString());
      const diff = auction_end_time.diff(now, "milliseconds");
      console.log("auction_end_time", auction_end_time);
      console.log("now", now);
      console.log("diff ms", diff);

      // Now we also need to determine when to end this auction again.
      auction_end_queue.add(
        {
          auction_entity_id: auction_entity_id,
        },
        {
          delay: diff,
        },
      );
    } else {
      console.log("Failed to find auction to process START job");
    }
  });
});
