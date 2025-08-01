import { Container, Service } from "typedi";
import { EntityId } from "redis-om";
import { ILot } from "../../models/lot";
import { LotRepository } from "../../schemas/redis/lot";
import ValidationError from "../../helpers/validation_error";
import { AuctionRepository } from "../../schemas/redis/auction";
import { FileRepository } from "../../schemas/redis/file";
import { getULID, redisClient } from "../../integration/redis/redis";
import moment from "moment-timezone";
import {
  LOT_BIDDING_CLOSED,
  LOT_BIDDING_OPEN,
  LOT_RNR
} from "../../helpers/constants/lot_enums";
import { vendor_bidding_queue } from "../../integration/redis/bull/queues/vendor_bidding";
import { AUCTION_IN_PROGRESS } from "../../helpers/constants/auction_enums";
import { BidRepository } from "../../schemas/redis/bid";
import { BidService3 } from "./bid";
import { CurrentLotRepository } from "../../schemas/redis/current_lot";
import { RealTimeCommunication } from "../../helpers/real_time_communication";
import { BID_ACTIVE } from "../../helpers/constants/bid_enums";

import { updateLotStatuses } from "./lot_status_updater";
@Service()
export class LotService3 {
  bidService = Container.get(BidService3);
  rtc_di = Container.get(RealTimeCommunication);
  
  public async createLot(lot: ILot) {
    // check if the auction exists
    const auction = await AuctionRepository.fetch(lot.auction_entity_id);
    const lotFrom = new Date(lot.date_from);
    const lotTo = new Date(lot.date_to);
    const auctionFrom = new Date(auction.date_from);
    const auctionTo = new Date(auction.date_to);
    if (lotFrom < auctionFrom || lotTo > auctionTo) {
      throw new Error("Lot date range must be within auction date range.");
    }
    // const auction = await AuctionRepository.fetch("01HWZ6A5RG2RHX6EAB3BFXVMPJ"); //2abc
    if (!auction.client_entity_id) {
      throw new ValidationError("Auction not found");
    }
    // set the next lot number
    const lots = await LotRepository.search() //
    .where("auction_entity_id")
    .eq(lot.auction_entity_id)
    .return.all();
    if (lots.length > 0) {
      const maxLotNumber = lots.reduce((prev, current) => {
        return prev.lot_number > current.lot_number ? prev : current;
      }).lot_number;
      
      lot.lot_number = parseInt(maxLotNumber.toString()) + 1;
    } else {
      lot.lot_number = 1;
    }
    
    const obj: ILot = {
      ...lot,
      type: auction.type.toString(), // use the auction's type
      created_at: moment().tz("Africa/Johannesburg").unix(),
    };
    const l = await LotRepository.save(obj);
    const entityId = l[EntityId as any];
    
    console.log("Lot created", entityId);
    
    // this.repository.expire(entityId, 60 * 60); // 1 hour
    
    return {
      entity_id: entityId,
      ...obj,
    };
  }
  public async updateLotDetails(lot_id: string, other_details: any) {
    
    
    const existingLot = await LotRepository.fetch(lot_id);
    if (!existingLot.auction_entity_id) {
      throw new ValidationError("Lot not found.");
    }
    if (existingLot) {
      // Update the reserve_price
      existingLot.reserve_price = other_details?.reserve_price||null;
      const lotDetails = await LotRepository.save(lot_id, existingLot);
      const auction = await AuctionRepository.fetch(lotDetails.auction_entity_id.toString());
      
      if(!lotDetails?.reserve_price&&!auction?.automated?.enabled){
        const latestBid = await BidRepository.search() //
        .where("lot_entity_id")
        .eq(lot_id)
        .sortBy("created_at", "DESC")
        .return.first();
        
        this.rtc_di.broadcastLotStatusForAuction(lot_id, {
          lot_entity_id: lot_id,
          lot_number: parseInt(lotDetails.lot_number.toString()),
          auction_entity_id: lotDetails.auction_entity_id.toString(),
          title: lotDetails.title.toString(),
          status: LOT_BIDDING_OPEN,
          type: lotDetails.type.toString(),
          reserve_price_check:true,
          reserve_price:lotDetails?.reserve_price,
          highest_bid: latestBid,
        });
      }
      
      if (auction.status.toString() === AUCTION_IN_PROGRESS && lotDetails.vendor_bidding?.enabled) {
        // Check if there is an existing vendor bidding job for this lot.
        const vendorBiddingJobs = await vendor_bidding_queue.getJobs(["delayed"]);
        const existingVendorBiddingJob = vendorBiddingJobs.find((job) => job.data.lot_entity_id === lot_id);
        if (existingVendorBiddingJob) {
          console.log("Removing existing vendor bidding job");
          await existingVendorBiddingJob.remove();
        }
        
        // Schedule a new vendor bidding job which will continue to place bids for this auction.
        vendor_bidding_queue.add(
          {
            lot_entity_id: lot_id,
          },
          {
            delay: moment.duration(lotDetails.vendor_bidding.timeout, "seconds").asMilliseconds(),
          },
        );
      } else if (lotDetails.vendor_bidding?.enabled == false) {
        // we need to check if there is any existing vendor bidding job for this lot and remove it.
        // if we save if without vendor bidding enabled, it means we need to remove any existing vendor bidding job.
        
        const withTimeout = (promise, ms) => {
          return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout reached")), ms))]);
        };
        
        try {
          const vendorBiddingJobs = await withTimeout(vendor_bidding_queue.getJobs(["delayed"]), 5000);
          const existingVendorBiddingJob = vendorBiddingJobs.find((job) => job.data.lot_entity_id === lot_id);
          
          if (existingVendorBiddingJob) {
            console.log("Removing existing vendor bidding job");
            await existingVendorBiddingJob.remove();
          }
        } catch (err) {
          console.error("Failed to fetch jobs:", err);
        }
      }
      return lotDetails
    } else {
      console.error(`Lot with entity_id ${lot_id} not found.`);
      return
    }
    
    
    // const auction = await AuctionRepository.fetch(existingLot.auction_entity_id.toString());
    
  }
  public async updateLot(entity_id: string, lot: ILot) {
    const existingLot = await LotRepository.fetch(entity_id);
    if (!existingLot.auction_entity_id) {
      throw new ValidationError("Lot not found.");
    }
    
    const auction = await AuctionRepository.fetch(
      existingLot.auction_entity_id.toString()
    );
    if (!auction.client_entity_id) {
      throw new ValidationError("Auction not found.");
    }
    
    const objToSave = {
      ...existingLot,
      ...lot,
      // created_at: moment(existingLot.created_at.toString()).tz("Africa/Johannesburg").unix(),
      updated_at: moment().tz("Africa/Johannesburg").unix(),
    };
    
    const l: any = await LotRepository.save(entity_id, objToSave);
    const entityId = l[EntityId as any];
    
    // Check if the auction is in progress and the vendor_bidding is enabled.
    if (
      auction.status.toString() === AUCTION_IN_PROGRESS &&
      objToSave.vendor_bidding?.enabled
    ) {
      // Check if there is an existing vendor bidding job for this lot.
      const vendorBiddingJobs = await vendor_bidding_queue.getJobs(["delayed"]);
      const existingVendorBiddingJob = vendorBiddingJobs.find(
        (job) => job.data.lot_entity_id === entityId
      );
      if (existingVendorBiddingJob) {
        console.log("Removing existing vendor bidding job");
        await existingVendorBiddingJob.remove();
      }
      
      // Schedule a new vendor bidding job which will continue to place bids for this auction.
      vendor_bidding_queue.add(
        {
          lot_entity_id: entityId,
        },
        {
          delay: moment
          .duration(l.vendor_bidding.timeout, "seconds")
          .asMilliseconds(),
        }
      );
    } else if (objToSave.vendor_bidding?.enabled == false) {
      // we need to check if there is any existing vendor bidding job for this lot and remove it.
      // if we save if without vendor bidding enabled, it means we need to remove any existing vendor bidding job.
      const withTimeout = (promise, ms) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout reached")), ms)
        ),
      ]);
    };
    
    try {
      const vendorBiddingJobs = await withTimeout(
        vendor_bidding_queue.getJobs(["delayed"]),
        10000
      );
      const existingVendorBiddingJob = vendorBiddingJobs.find(
        (job) => job.data.lot_entity_id === entityId
      );
      
      if (existingVendorBiddingJob) {
        console.log("Removing existing vendor bidding job");
        await existingVendorBiddingJob.remove();
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  }
  
  console.log("Lot updated", entityId);
  
  return {
    ...objToSave,
    entity_id: entityId,
  };
}

public async getLot(entity_id: string) {
  let lot = await LotRepository.fetch(entity_id);
  
  // RedisOM still an entry entity if its not found.
  // So we need to check if an important field exists.
  if (lot.auction_entity_id) {
    // const entityId = lot[EntityId as any];
    lot.entity_id = lot[EntityId as any];
    
    // Inject first image for each lot
    lot.entity_id = lot[EntityId as any];
    
    const images = await FileRepository.search() //
    .where("lot_entity_id")
    .eq(entity_id)
    .and("type")
    .eq("Image")
    .and("other_info")
    .not.eq("lot_broker_image")
    .sortBy("order", "ASC")
    .return.all();
    const broker_images = await FileRepository.search() //
    .where("lot_entity_id")
    .eq(entity_id)
    .and("type")
    .eq("Image")
    .and("other_info")
    .eq("lot_broker_image")
    .sortBy("order", "ASC")
    .return.all();
    
    if (broker_images && broker_images.length > 0) {
      lot.broker_images = broker_images.map((img) => {
        return { ...img, entity_id: img[EntityId as any] };
      });
    }
    if (images && images.length > 0) {
      lot.images = images.map((img) => {
        return { ...img, entity_id: img[EntityId as any] };
      });
    }
    
    const documents = await FileRepository.search() //
    .where("lot_entity_id")
    .eq(entity_id)
    .and("type")
    .eq("Document")
    .return.all();
    
    if (documents && documents.length > 0) {
      lot.documents = documents.map((doc) => {
        return { ...doc, entity_id: doc[EntityId as any] };
      });
    }
    
    return lot;
  } else {
    throw new ValidationError("Lot not found.");
  }
}

public async lotsForAuction(auction_entity_id: string, get_images = true) {
  const lots = await LotRepository.search() //
  .where("auction_entity_id")
  .eq(auction_entity_id)
  .sortBy("lot_number", "ASC")
  .return.all();
  
  for (let lot of lots) {
    lot.entity_id = lot[EntityId as any];
    
    if (get_images) {
      // Inject first image for each lot
      const firstImage = await FileRepository.search() //
      .where("lot_entity_id")
      .eq(lot[EntityId as any])
      .and("type")
      .eq("Image")
      .sortBy("order", "ASC")
      .return.first();
      
      if (firstImage?.uploaded_file_url) {
        lot.images = [
          {
            entity_id: firstImage[EntityId as any],
            uploaded_file_url: firstImage.uploaded_file_url,
          },
        ];
      } else {
        lot.images = [];
      }
    }
  }
  
  // console.log("Lots fetched", lots);
  
  return lots;
}

public async lotsWithBids(auction_entity_id: string) {
  const lots = await LotRepository.search() //
  .where("auction_entity_id")
  .eq(auction_entity_id)
  .sortBy("lot_number", "ASC")
  .return.all();
  
  // Inject first image for each lot
  for (let lot of lots) {
    lot.entity_id = lot[EntityId as any];
    
    // const firstImage = await FileRepository.search() //
    // .where("lot_entity_id")
    // .eq(lot[EntityId as any])
    // .sortBy("order", "ASC")
    // .return.first();
        const firstImage = await FileRepository.search() //
    .where("lot_entity_id")
    .eq(lot[EntityId as any])
    .and("type")
    .eq("Image")
    .and("other_info")
    .not.eq("lot_broker_image")
    .sortBy("order", "ASC")
    .return.first();
    
    if (firstImage?.uploaded_file_url) {
      lot.images = [
        {
          entity_id: firstImage[EntityId as any],
          uploaded_file_url: firstImage.uploaded_file_url,
        },
      ];
    }
    
    // Get all bids for the lot
    const bidsForLot = await this.bidService.bidsForLot(
      lot[EntityId as any],
      0,
      10
    );
    // console.log("bidsForLot", bidsForLot);
    lot.bids = bidsForLot;
  }
  
  return lots;
}

public async deleteLot(entity_id: string) {
  // await LotRepository.remove(entity_id);
  
  const multi = redisClient.multi();
  
  // delete the lot from redis
  multi.del(`LOT:${entity_id}`);
  
  // delete the files from redis
  const files = await FileRepository.search() //
  .where("lot_entity_id")
  .eq(entity_id)
  .return.all();
  
  for (const file of files) {
    multi.del(`FILE:${file[EntityId as any]}`);
  }
  
  multi.exec();
}

public async deleteAllLots(auction_entity_id: string) {
  const lots = await LotRepository.search() //
  .where("auction_entity_id")
  .eq(auction_entity_id)
  .return.all();
  
  const multi = redisClient.multi();
  
  for (const lot of lots) {
    multi.del(`LOT:${lot[EntityId as any]}`);
    
    const files = await FileRepository.search() //
    .where("lot_entity_id")
    .eq(lot[EntityId as any])
    .return.all();
    
    for (const file of files) {
      multi.del(`FILE:${file[EntityId as any]}`);
    }
  }
  
  multi.exec();
}

async openLotsForAuction(auction_entity_id: string) {
  const lots = await LotRepository.search() //
  .where("auction_entity_id")
  .eq(auction_entity_id)
  .and("status")
  .eq(LOT_BIDDING_OPEN)
  .return.all();
  
  return lots.length > 0;
}

async updateLotsOrder(
  order: { lot_entity_id: string; lot_number: number }[]
) {
  // fetch all lots id's defined in the order array
  const lotIds = order.map((o) => o.lot_entity_id);
  const lots = await LotRepository.fetch(lotIds);
  
  const multi = redisClient.multi();
  
  for (const o of order) {
    const lot = lots.find((l) => l[EntityId as any] === o.lot_entity_id);
    
    if (lot) {
      multi.json.set(`LOT:${o.lot_entity_id}`, "$", {
        ...lot,
        lot_number: o.lot_number,
        created_at: moment(lot.created_at.toString())
        .tz("Africa/Johannesburg")
        .unix(),
        updated_at: moment().tz("Africa/Johannesburg").unix(),
      });
    }
  }
  
  multi.exec();
}

async uploadCSV(auction_entity_id: string, records: any[]) {
  const auction = await AuctionRepository.fetch(auction_entity_id);
  
  if (!auction.client_entity_id) {
    throw new ValidationError("Auction not found.");
  }
  
  const multi = redisClient.multi();
  
  for (const csvRecord of records) {
    const newHashKey = `${"LOT:"}${getULID()}`;
    
    const lot: ILot = {
      auction_entity_id: auction_entity_id,
      lot_number: csvRecord.lot_number,
      title: csvRecord.title,
      description: csvRecord.description,
      status: LOT_BIDDING_CLOSED,
      type: auction.type.toString(),
      extra_data: csvRecord.extra_data,
      starting_price: 0,
      reserve_price: 0, // TODO investigate this
      youtube_url: "",
      created_at: moment().tz("Africa/Johannesburg").unix(),
      vendor_bidding: {
        enabled: false,
        bid_increment: 0,
        bid_limit: 0,
        timeout: 0,
      },
    };
    
    multi.json.set(newHashKey, "$", lot);
  }
  
  multi.exec();
}

public getCSVTemplate(): string {
  return `#;Title/Heading;Description/History;Year;Colour;Mileage;Transmission;Fuel`;
}

async manualPreviousCurrentNext(auction_entity_id: string) {
  const auction = await AuctionRepository.fetch(auction_entity_id);
  
  if (!auction.client_entity_id) {
    throw new ValidationError("Auction not found.");
  }
  
  const currentLot = await CurrentLotRepository.search() //
  .where("auction_entity_id")
  .eq(auction_entity_id)
  .return.first();
  
  if (currentLot) {
    const lots = await LotRepository.search() //
    .where("auction_entity_id")
    .eq(auction_entity_id)
    .sortBy("lot_number", "ASC")
    .return.all();
    
    // from the list we need to find the previous, current, next
    let current: any = lots.find(
      (l) => l[EntityId as any] === currentLot.lot_entity_id
    );
    
    if (current) {
      let previous = lots.find(
        (l: any) => l.lot_number === current.lot_number - 1
      );
      
      // the next lot must be open for bidding
      let next: any;
      for (let i = current.lot_number + 1; i < lots.length + 1; i++) {
        next = lots.find((l: any) => l.lot_number === i);
        if (next && next.status === LOT_BIDDING_OPEN) {
          break;
        }
      }
      
      if (previous) {
        const image = await FileRepository.search() //
        .where("lot_entity_id")
        .eq(previous[EntityId as any])
        .and("type")
        .eq("Image")
        .sortBy("order", "ASC")
        .return.first();
        
        if (image) {
          previous.images = [{ ...image, entity_id: image[EntityId as any] }];
        }
      }
      
      if (current) {
        const image = await FileRepository.search() //
        .where("lot_entity_id")
        .eq(current[EntityId as any])
        .and("type")
        .eq("Image")
        .sortBy("order", "ASC")
        .return.first();
        
        if (image) {
          current.images = [{ ...image, entity_id: image[EntityId as any] }];
        }
      }
      
      if (next) {
        const image = await FileRepository.search() //
        .where("lot_entity_id")
        .eq(next[EntityId as any])
        .and("type")
        .eq("Image")
        .sortBy("order", "ASC")
        .return.first();
        
        if (image) {
          next.images = [{ ...image, entity_id: image[EntityId as any] }];
        }
      }
      
      return {
        previous: previous && {
          ...previous,
          entity_id: previous[EntityId as any],
        },
        current: current && {
          ...current,
          entity_id: current[EntityId as any],
        },
        next: next && {
          ...next,
          entity_id: next[EntityId as any],
        },
      };
    } else {
      console.info("The saved current lot could not be found.");
      return null;
    }
  } else {
    return null;
  }
}

async manualSetCurrent(auction_entity_id: string, lot_entity_id: string) {
  const auction = await AuctionRepository.fetch(auction_entity_id);
  
  if (!auction.client_entity_id) {
    throw new ValidationError("Auction not found.");
  }
  
  const lot = await LotRepository.fetch(lot_entity_id);
  
  if (!lot.auction_entity_id) {
    throw new ValidationError("Lot not found.");
  }
  
  let nextLotEntityId = lot_entity_id;
  
  // if this lot is not open for bidding, we need to move on to the next open lot.
  if (lot.status !== LOT_BIDDING_OPEN) {
    console.info("The lot is not open for bidding, moving to the next lot.");
    
    const lots = await LotRepository.search() //
    .where("auction_entity_id")
    .eq(auction_entity_id)
    .sortBy("lot_number", "ASC")
    .return.all();
    
    let current: any = lots.find((l) => l[EntityId as any] === lot_entity_id);
    
    // find the next open lot
    do {
      current = lots.find(
        (l: any) => l.lot_number === current.lot_number + 1
      );
    } while (current && current.status !== LOT_BIDDING_OPEN);
    
    nextLotEntityId = current ? current[EntityId as any] : null;
  }
  
  const currentLot = await CurrentLotRepository.search() //
  .where("auction_entity_id")
  .eq(auction_entity_id)
  .return.first();
  
  if (currentLot) {
    // update the current lot
    await CurrentLotRepository.save(currentLot[EntityId as any], {
      lot_entity_id: nextLotEntityId,
      auction_entity_id: auction_entity_id,
    });
  } else {
    // create the current lot
    await CurrentLotRepository.save({
      lot_entity_id: nextLotEntityId,
      auction_entity_id: auction_entity_id,
    });
  }
  
  await this.manualLotStatus(nextLotEntityId, LOT_BIDDING_OPEN);
  
  this.rtc_di.broadcastCurrentLot(auction_entity_id, {
    current: nextLotEntityId,
  });
  
  return lot;
}

public async manualLotStatus(entity_id: string, status: string) {
  const existingLot = await LotRepository.fetch(entity_id);
  if (!existingLot.auction_entity_id) {
    throw new ValidationError("Lot not found.");
  }
  
  const objToSave = {
    ...existingLot,
    updated_at: moment().tz("Africa/Johannesburg").unix(),
    status: status=="Reserve Not reached"?LOT_RNR:status,
  };
  
  const l: any = await LotRepository.save(entity_id, objToSave);
  const entityId = l[EntityId as any];
  
  const latestBid = await BidRepository.search() //
  .where("lot_entity_id")
  .eq(entityId)
  .and("status")
  .eq(BID_ACTIVE)
  .sortBy("created_at", "DESC")
  .return.first();
  
  this.rtc_di.broadcastLotStatusForAuction(
    existingLot.auction_entity_id.toString(),
    {
      lot_entity_id: entity_id,
      lot_number: parseInt(existingLot.lot_number.toString()),
      auction_entity_id: existingLot.auction_entity_id.toString(),
      title: existingLot.title.toString(),
      status: status,
      type: existingLot.type.toString(),
      highest_bid: latestBid,
    }
  );
  
  return {
    ...objToSave,
    entity_id: entityId,
  };
}




public async lotStatusUpdate(lotID) {
    try {
       const reponse =  await updateLotStatuses(lotID);
        return reponse;
    } catch (err) {
        console.error(err);
        return err
    }
};

}
