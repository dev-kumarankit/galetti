import { Service } from "typedi";
import { EntityId } from "redis-om";
import { LotRepository } from "../../schemas/redis/lot";
import { AuctionRepository } from "../../schemas/redis/auction";
import { AuctionCollection } from "../../schemas/mongo/auction";
import { ClientRepository } from "../../schemas/redis/client";
import { IAuction } from "../../models/auction";
import ValidationError from "../../helpers/validation_error";
import { FileRepository } from "../../schemas/redis/file";
import { auction_start_queue } from "../../integration/redis/bull/queues/auction_start";
import moment from "moment-timezone";
import { auction_end_queue } from "../../integration/redis/bull/queues/auction_end";
import { extended_lot_queue } from "../../integration/redis/bull/queues/lot_extended";
import {
  AUCTION_COMPLETE,
  AUCTION_IN_PROGRESS,
  AUCTION_UPCOMING,
} from "../../helpers/constants/auction_enums";
import { Container } from "typedi";
import { Dolby } from "../../integration/dolby/dolby";
import { RealTimeCommunication } from "../../helpers/real_time_communication";
import {
  LOT_BIDDING_CLOSED,
  LOT_BIDDING_OPEN,
} from "../../helpers/constants/lot_enums";
import { CurrentLotRepository } from "../../schemas/redis/current_lot";
import { LotCollection } from "../../schemas/mongo/lot";
import { FileCollection } from "../../schemas/mongo/file";
import { BidderRepository } from "../../schemas/redis/bidder";

@Service()
export class AuctionService3 {
  private dolby = Container.get(Dolby);
  private rtc_di = Container.get(RealTimeCommunication);

  public async createAuction(auction: IAuction) {
    // check if client exists
    const client = await ClientRepository.fetch(auction.client_entity_id);
    if (!client.name) {
      throw new ValidationError("Client not found");
    }

    const objToSave: IAuction = {
      ...auction,
      created_at: moment().tz("Africa/Johannesburg").unix(),
    };

    const savedObj = await AuctionRepository.save(objToSave);
    const entityId = savedObj[EntityId as any];

    if (objToSave.automated?.enabled) {
      // only schedule if date_from is in the future
      if (moment(objToSave.date_from) > moment().tz("Africa/Johannesburg")) {
        // const jobs = await auctionQueue.getJobs(["waiting", "delayed"]);
        // const existingJob = jobs.find((job) => job.data.auction_entity_id === entityId);
        // if (existingJob) {
        //   await existingJob.remove();
        // }

        auction_start_queue.add(
          {
            auction_entity_id: entityId,
          },
          {
            delay: moment(moment(objToSave.date_from)).diff(
              moment().tz("Africa/Johannesburg"),
              "milliseconds"
            ),
          }
        );
      } else {
        console.log("Auction is in the past, not scheduling");
      }
    } else {
      // This is a manual auction, we need to create a millicast stream for it.
      const resp = await this.dolby.createStream(objToSave.title);
      if (resp?.id) {
        objToSave.live_stream = resp;

        await AuctionRepository.save(entityId, objToSave);
      } else {
        throw new ValidationError("Failed to create dolby stream");
      }
    }

    console.log("Auction created", entityId);

    return {
      entity_id: entityId,
      ...savedObj,
    };
  }

  public async get(payload: any) {
    const { user_entity_id, entity_id }: any = payload;
    const auction = await AuctionRepository.fetch(entity_id);
    if (!auction.client_entity_id) {
      throw new ValidationError("Auction not found.");
    }

    const images = await FileRepository.search() //
      .where("auction_entity_id")
      .eq(entity_id)
      .and("type")
      .eq("Image")
      .sortBy("order", "ASC")
      .return.all();

    if (images && images.length > 0) {
      auction.images = images.map((img) => {
        return { ...img, entity_id: img[EntityId as any] };
      });
    }

    const documents = await FileRepository.search() //
      .where("auction_entity_id")
      .eq(entity_id)
      .and("type")
      .eq("Document")
      .return.all();

    if (documents && documents.length > 0) {
      auction.documents = documents.map((doc) => {
        return { ...doc, entity_id: doc[EntityId as any] };
      });
    }

    auction.entity_id = auction[EntityId as any];
    let registeredAuctionIds: any = new Set<string>();

    if (user_entity_id) {
      const finalData = await BidderRepository.search()
        .where("user_entity_id")
        .eq(user_entity_id.toString())
        .all();

      registeredAuctionIds = new Set(
        finalData.map((data) => data.registered_auction_id)
      );
    }

    return {
      ...auction,
      auction_registered: registeredAuctionIds.has(auction.entity_id),
    };
  }

  async update(entity_id: string, entity: IAuction) {
    const auction = await AuctionRepository.fetch(entity_id);
    if (!auction.client_entity_id) {
      throw new ValidationError("Auction not found.");
    }

    const objToSave: IAuction = {
      ...auction,
      ...entity,
      updated_at: moment().tz("Africa/Johannesburg").unix(),
    };

    const a = await AuctionRepository.save(entity_id, objToSave);
    const entityId = a[EntityId as any];

    if (objToSave.automated?.enabled) {
      // only schedule if date_from is in the future
      if (moment(objToSave.date_from) > moment().tz("Africa/Johannesburg")) {
        // const jobs = await auctionQueue.getJobs(["waiting", "delayed"]);
        // const existingJob = jobs.find((job) => job.data.auction_entity_id === entityId);
        // if (existingJob) {
        //   await existingJob.remove();
        // }

        // if an auction is in progress, we need to remove it and add it again
        const startingJobs = await auction_start_queue.getJobs(["delayed"]);
        const endingJobs = await auction_end_queue.getJobs(["delayed"]);
        const existingStartJob = startingJobs.find(
          (job) => job.data.auction_entity_id === entityId
        );
        const existingEndJob = endingJobs.find(
          (job) => job.data.auction_entity_id === entityId
        );
        if (existingStartJob) {
          console.log("Removing existing start job");
          await existingStartJob.remove();
        }
        if (existingEndJob) {
          console.log("Removing existing end job");
          await existingEndJob.remove();
        }

        const d = moment(moment(objToSave.date_from)).diff(
          moment(),
          "milliseconds"
        );
        console.log("Scheduling auction start in", d, "ms");
        auction_start_queue.add(
          {
            auction_entity_id: entityId,
          },
          {
            delay: d,
          }
        );
      } else {
        console.log("Auction is in the past, not scheduling");
        // check though, if there are ongoing auctions_end jobs, we need to remove them
        // if the end date is also in the past
        if (moment(objToSave.date_to) < moment().tz("Africa/Johannesburg")) {
          const endingJobs = await auction_end_queue.getJobs(["delayed"]);
          const existingEndJob = endingJobs.find(
            (job) => job.data.auction_entity_id === entityId
          );
          if (existingEndJob) {
            console.log("Removing existing end job");
            await existingEndJob.remove();
          }
        }
      }

      // automated auctions should not have a live stream
      if (objToSave.live_stream?.id) {
        await this.dolby.deleteStream(objToSave.live_stream.id);
        delete objToSave.live_stream; // remove the live stream prop
        await AuctionRepository.save(entityId, objToSave);
      }
    } else {
      // This is a manual auction, we need to create a millicast stream for it if has not been created yet.
      if (!objToSave.live_stream?.id) {
        // we need to create a stream
        const resp = await this.dolby.createStream(objToSave.title);
        if (resp?.id) {
          objToSave.live_stream = resp;

          await AuctionRepository.save(entityId, objToSave);
        } else {
          throw new ValidationError("Failed to create dolby stream");
        }
      }

      // We also need to remove any existing auction_start jobs. We may have saved the auction with `automated enabled` and then disabled it afterwards.
      const startingJobs = await auction_start_queue.getJobs(["delayed"]);
      const existingStartJob = startingJobs.find(
        (job) => job?.data?.auction_entity_id === entityId
      );
      if (existingStartJob) {
        console.log("Removing existing start job");
        await existingStartJob.remove();
      }
    }

    console.log("Auction updated", entityId);

    return {
      entity_id: entityId,
      ...objToSave,
    };
  }

  public async delete(entity_id: string) {
    // this.millicast.deleteStream
    const auction: any = await AuctionRepository.fetch(entity_id);

    if (!auction.client_entity_id) {
      throw new ValidationError("Auction not found.");
    }

    if (auction.live_stream?.id) {
      await this.dolby.deleteStream(auction.live_stream.id);
    }

    //TODO maybe also delete the lots, etc

    await AuctionRepository.remove(entity_id);
  }

  async auctionsForClient(data: any) {
    const client_entity_id = data?.entity_id;
    const { user_entity_id } = data;

    const auctions = await AuctionRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .sortBy("date_from", "ASC") // Sort dates ascending here, we then need to split them into 1. In-Progress First, 2. Upcoming, 3. Completed
      .return.all();

    // join the images and documents
    for (const auction of auctions) {
      const images = await FileRepository.search() //
        .where("auction_entity_id")
        .eq(auction[EntityId as any])
        .and("type")
        .eq("Image")
        .sortBy("order", "ASC")
        .return.all();

      const documents = await FileRepository.search() //
        .where("auction_entity_id")
        .eq(auction[EntityId as any])
        .and("type")
        .eq("Document")
        .return.all();

      auction.images = images;
      auction.documents = documents;
    }

    // Sort in-progress auctions on top, then upcoming, then completed
    const inProgress = auctions.filter((a) => a.status === AUCTION_IN_PROGRESS);
    const upcoming = auctions.filter((a) => a.status === AUCTION_UPCOMING);
    const completed = auctions.filter((a) => a.status === AUCTION_COMPLETE);
    const sortedAuctionList = [...inProgress, ...upcoming, ...completed];

    let registeredAuctionIds: any = new Set<string>();

    if (user_entity_id) {
      const finalData = await BidderRepository.search()
        .where("user_entity_id")
        .eq(user_entity_id.toString())
        .all();

      registeredAuctionIds = new Set(
        finalData.map((data) => data.registered_auction_id)
      );
    }

    // Map the sortedAuctionList with the auction_registered flag
    const result = sortedAuctionList.map((auction: any) => {
      const auctionId = auction[EntityId as keyof typeof auction];

      return {
        entity_id: auctionId,
        auction_registered: registeredAuctionIds.has(auctionId),
        ...auction,
      };
    });

    return result;
  }

  async remainingTime(auction_entity_id: string) {
    const auction = await AuctionRepository.fetch(auction_entity_id);
    if (!auction.date_from) {
      throw new ValidationError("Auction not found.");
    }

    //From Bull.js we need to find the fob associated to this auction's entity_id.
    const jobs = await auction_end_queue.getJobs(["waiting", "delayed"]);
    const auctionEndJob = jobs.find(
      (job) => job.data.auction_entity_id === auction_entity_id
    );
    if (auctionEndJob) {
      const timestamp = auctionEndJob.timestamp; // 1717248600027
      const delay = auctionEndJob.opts.delay; // 257399974

      const now = moment().tz("Africa/Johannesburg");
      const end = moment(timestamp + delay).tz("Africa/Johannesburg");

      const diff = end.diff(now, "milliseconds");

      const remainingTime = moment.duration(diff);
      //00:00:00:00 - days:hours:minutes:seconds with padded zeros for double digits
      const remainingTimeFormatted = `${remainingTime
        .days()
        .toString()
        .padStart(2, "0")}:${remainingTime
        .hours()
        .toString()
        .padStart(2, "0")}:${remainingTime
        .minutes()
        .toString()
        .padStart(2, "0")}:${remainingTime
        .seconds()
        .toString()
        .padStart(2, "0")}`;
      return {
        remaining_time: remainingTimeFormatted,
      };
    } else {
      // throw new ValidationError("Auction end job not found.");

      //TODO: its going to be tough, but we could find a way to determine the lot with the longest time remaining somehow.
      return {
        remaining_time: "00:00:00:00",
      };
    }
  }

  async hasExtendedLots(auction_entity_id: string) {
    const jobs = await extended_lot_queue.getJobs(["delayed"]);

    const lots = await LotRepository.search() //
      .where("auction_entity_id")
      .eq(auction_entity_id)
      .return.all();

    // Determine if there are any lots that have been extended
    const extendedLots = jobs.filter((job) => {
      const { lot_entity_id } = job.data;
      return lots.some((lot) => lot[EntityId as any] === lot_entity_id);
    });

    return extendedLots.length > 0;
  }

  /**
   * @deprecated !!!!! do not use "firstLiveAuction" any longer use "extendedAuctions" instead
   **/
  async firstLiveAuction(client_entity_id: string) {
    const firstInProgress = await AuctionRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .and("status")
      .eq(AUCTION_IN_PROGRESS)
      .return.first();

    if (firstInProgress) {
      return {
        ...firstInProgress,
        entity_id: firstInProgress[EntityId as any],
      };
    } else {
      // There's no live auction. Let's check if there are any auctions with extended lots.
      const auctions = await AuctionRepository.search() //
        .where("client_entity_id")
        .eq(client_entity_id)
        .return.all();

      for (const auction of auctions) {
        const hasExtendedLots = await this.hasExtendedLots(
          auction[EntityId as any]
        );
        if (hasExtendedLots) {
          // Break the loop ASAP.
          return {
            ...auction,
            entity_id: auction[EntityId as any],
          };
        }
      }

      // There are no auctions with extended lots.
      return null;
    }
  }

  async extendedAuctions(client_entity_id: string) {
    // An extended auction is one that has had its lots extended.
    // It is also generally an auction that has ended already, not one that is in progress.
    const auctions = await AuctionRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .and("status")
      .eq(AUCTION_COMPLETE)
      .return.all();

    const extendedAuctions = [];
    for (const auction of auctions) {
      const hasExtendedLots = await this.hasExtendedLots(
        auction[EntityId as any]
      );
      if (hasExtendedLots) {
        extendedAuctions.push({
          ...auction,
          entity_id: auction[EntityId as any],
        });
      }
    }

    return extendedAuctions;
  }

  async manualStart(auction_entity_id: string) {
    const auction = await AuctionRepository.fetch(auction_entity_id);
    if (!auction.client_entity_id) {
      throw new ValidationError("Auction not found.");
    }

    // set this auction to live
    auction.status = AUCTION_IN_PROGRESS;
    await AuctionRepository.save(auction_entity_id, auction);

    // we also need to set all lot statuses to Bidding Open
    const lots = await LotRepository.search() //
      .where("auction_entity_id")
      .eq(auction_entity_id)
      .sortBy("lot_number", "ASC")
      .return.all();

    // check if there are any lots
    if (lots.length === 0) {
      throw new ValidationError("An auction needs at least one lot to start.");
    }

    // the first lot must now be the current lot
    if (lots[0]) {
      await CurrentLotRepository.save({
        auction_entity_id: auction_entity_id,
        lot_entity_id: lots[0][EntityId as any],
      });
    }

    //TODO maybe use a transaction here (multi)
    for (const lot of lots) {
      lot.status = LOT_BIDDING_OPEN;
      await LotRepository.save(lot[EntityId as any], lot);
    }

    this.rtc_di.broadcastAuctionManualStart(
      auction.client_entity_id.toString(),
      {
        entity_id: auction_entity_id,
        title: auction.title.toString(),
        description: auction.description.toString(),
        status: AUCTION_IN_PROGRESS,
        type: auction.type.toString(),
      }
    );

    return true;
  }

  async manualEnd(auction_entity_id: string) {
    const auction = await AuctionRepository.fetch(auction_entity_id);
    if (!auction.client_entity_id) {
      throw new ValidationError("Auction not found.");
    }

    // set this auction to complete
    auction.status = AUCTION_COMPLETE;
    await AuctionRepository.save(auction_entity_id, auction);

    const lots = await LotRepository.search() //
      .where("auction_entity_id")
      .eq(auction_entity_id)
      .return.all();

    for (const lot of lots) {
      if (lot.status == LOT_BIDDING_OPEN) {
        // we need to set all lot statuses to Bidding Closed if they are on Bidding Open.
        lot.status = LOT_BIDDING_CLOSED;
        await LotRepository.save(lot[EntityId as any], lot);
      }
    }

    // we can also delete the current lot
    const curentLot = await CurrentLotRepository.search() //
      .where("auction_entity_id")
      .eq(auction_entity_id)
      .return.first();
    await CurrentLotRepository.remove(curentLot[EntityId as any]);

    this.rtc_di.broadcastAuctionManualStop(
      auction.client_entity_id.toString(),
      {
        entity_id: auction_entity_id,
        title: auction.title.toString(),
        description: auction.description.toString(),
        status: AUCTION_COMPLETE,
        type: auction.type.toString(),
      }
    );

    return true;
  }
}
