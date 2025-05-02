import Bull from "bull";
import { getRedisUrl } from "../../../../integration/redis/redis";
import { AuctionRepository } from "../../../../schemas/redis/auction";
import { AUCTION_COMPLETE, AUCTION_IN_PROGRESS } from "../../../../helpers/constants/auction_enums";
import Container from "typedi";
import { RealTimeCommunication } from "../../../../helpers/real_time_communication";
import { LotRepository } from "../../../../schemas/redis/lot";
import { BidRepository } from "../../../../schemas/redis/bid";
import { EntityId } from "redis-om";
import moment from "moment-timezone";
import { BID_ACTIVE } from "../../../../helpers/constants/bid_enums";
import { extended_lot_queue } from "./lot_extended";
import { LOT_BIDDING_CLOSED, LOT_BIDDING_OPEN, LOT_SOLD } from "../../../../helpers/constants/lot_enums";

export const auction_end_queue = new Bull(`AUCTION_END`, getRedisUrl(), {
  redis: {
    keyPrefix: "BULL",
    password: process.env.REDIS_PASSWORD,
  },
});

auction_end_queue.process(async (job) => {
  const { data } = job;
  const { auction_entity_id } = data;
  const rtc_di = Container.get(RealTimeCommunication);

  AuctionRepository.fetch(auction_entity_id).then(async (auction: any) => {
    if (auction.client_entity_id) {
      let hasExtendedLots = false;

      // update the auction status to complete, but we broadcast this change at the end.
      await AuctionRepository.save(auction_entity_id, {
        ...auction,
        status: AUCTION_COMPLETE,
        updated_at: moment().tz("Africa/Johannesburg").format(),
      });

      job.finished().then(() => {
        console.log("Auction end job has finished, cleaning up.");
        job.remove(); // clean up redis
      });

      // Now we also need to get the latest bid for each lot for this auction.
      // Then we need to check if the bid has been placed within the saved soft_closing.timeout timeframe.
      // If a bid has been placed within the timeframe, we need to create a new bull delay for that lot.
      // If no bids have been placed, we need to determine if the lot has been SOLD, etc.

      const lots = await LotRepository.search().where("auction_entity_id").eq(auction_entity_id).return.all();

      for (const lot of lots) {
        if (lot.status != LOT_BIDDING_OPEN) {
          console.log(`Lot's status is ${lot.status}. Can only act on lots that are still set to ${LOT_BIDDING_OPEN}`, lot[EntityId]);
          continue;
        }

        const latestBid = await BidRepository.search() //
          .where("lot_entity_id")
          .eq(lot[EntityId])
          .and("status")
          .eq(BID_ACTIVE)
          .sortBy("created_at", "DESC")
          .return.first();

        if (latestBid) {
          const now = moment();
          const latestBidDate = moment(new Date(latestBid.created_at.toString()));
          const diff = now.diff(latestBidDate, "milliseconds");

          console.log("latestBidDate", latestBidDate);
          console.log("now", now);
          console.log("diff ms", diff);

          if (auction.automated.soft_closing?.enabled) {
            // If bid has been placed within the soft closing timeout, we need to extend the lot.
            if (diff < moment.duration(auction.automated.soft_closing.timeout, "seconds").asMilliseconds()) {
              console.log("Lot has been bid on within the soft closing timeout");

              extended_lot_queue.add(
                {
                  lot_entity_id: lot[EntityId],
                },
                {
                  delay: moment.duration(auction.automated.soft_closing.timeout, "seconds").asMilliseconds(),
                },
              );

              rtc_di.broadcastLotExtended(lot[EntityId], {
                lot: {
                  entity_id: lot[EntityId],
                  title: lot.title.toString(),
                  lot_number: lot.lot_number.toString(),
                },
              });

              hasExtendedLots = true;
            } else {
              console.log("Lot has not been bid on within the soft closing timeout");
              // Set the lot status to Sold.
              await LotRepository.save(lot[EntityId], {
                ...lot,
                status: LOT_SOLD,
              });

              // rtc_di.broadcastLotStatus(lot[EntityId], {
              rtc_di.broadcastLotStatusForAuction(auction_entity_id, {
                lot_entity_id: lot[EntityId],
                lot_number: parseInt(lot.lot_number.toString()),
                auction_entity_id: lot.auction_entity_id.toString(),
                title: lot.title.toString(),
                status: LOT_SOLD,
                type: lot.type.toString(),
                highest_bid: latestBid,
              });
            }
          } else {
            console.log("Soft closing not enabled for this auction.");
            // We have bids, set the lot status to Sold.
            await LotRepository.save(lot[EntityId], {
              ...lot,
              status: LOT_SOLD,
            });

            // rtc_di.broadcastLotStatus(lot[EntityId], {
            rtc_di.broadcastLotStatusForAuction(auction_entity_id, {
              lot_entity_id: lot[EntityId],
              lot_number: parseInt(lot.lot_number.toString()),
              auction_entity_id: lot.auction_entity_id.toString(),
              title: lot.title.toString(),
              status: LOT_SOLD,
              type: lot.type.toString(),
              highest_bid: latestBid,
            });
          }
        } else {
          console.log("No bids have been placed on this lot, setting it to Bidding Closed.");
          // Set the lot status to LOT_BIDDING_CLOSED.
          await LotRepository.save(lot[EntityId], {
            ...lot,
            status: LOT_BIDDING_CLOSED,
          });

          // rtc_di.broadcastLotStatus(lot[EntityId], {
          rtc_di.broadcastLotStatusForAuction(auction_entity_id, {
            lot_entity_id: lot[EntityId],
            lot_number: parseInt(lot.lot_number.toString()),
            auction_entity_id: lot.auction_entity_id.toString(),
            title: lot.title.toString(),
            status: LOT_BIDDING_CLOSED,
            type: lot.type.toString(),
            highest_bid: null,
          });
        }
      }

      // Now its time to broadcast the auction status to the client.
      rtc_di.broadcastAuctionStatus(auction_entity_id, {
        entity_id: auction_entity_id,
        status: AUCTION_COMPLETE,
        has_extended_lots: hasExtendedLots,
      });
      console.log("Auction completed", auction_entity_id);
    } else {
      console.log("Failed to find auction to process END job");
    }
  });
});
