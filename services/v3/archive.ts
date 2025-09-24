import { Service } from "typedi";
import { EntityId } from "redis-om";
import { LotRepository } from "../../schemas/redis/lot";
import { AuctionRepository } from "../../schemas/redis/auction";
import { AuctionCollection } from "../../schemas/mongo/auction";
import ValidationError from "../../helpers/validation_error";
import { FileRepository } from "../../schemas/redis/file";
import { LotCollection } from "../../schemas/mongo/lot";
import { FileCollection } from "../../schemas/mongo/file";
import { redisClient } from "../../integration/redis/redis";
import { BidRepository } from "../../schemas/redis/bid";
import { BidCollection } from "../../schemas/mongo/bid";
import { AUCTION_IN_PROGRESS } from "../../helpers/constants/auction_enums";
import moment from "moment";
import { ClientRepository } from "../../schemas/redis/client";
import { BidderRepository } from "../../schemas/redis/bidder";
import { UserRepository } from "../../schemas/redis/user";

@Service()
export class ArchiveService3 {
  public async archive(entity_id: string) {
    let auction_archive_success = false;
    let lots_archive_success = false;
    let auction_files_archive_success = false;
    let lot_files_archive_success = false;
    let bids_archive_success = false;

    const auction: any = await AuctionRepository.fetch(entity_id);

    if (!auction.client_entity_id) {
      throw new ValidationError("Auction not found in Redis. Therefore, we cannot archive it into Mongo.");
    }

    // Can only archive auctions that is not in progress
    if (auction.status == AUCTION_IN_PROGRESS) {
      throw new ValidationError("Auction is in progress. It cannot be archived right now. Please complete the auction first.");
    }

    // 1. Archive the AUCTION
    console.log("Archiving the auction", entity_id);
    await AuctionCollection.create([
      {
        ...auction,
        _id: entity_id,
        archived_at: new Date(),
        restored_at: null,
      },
    ]);
    auction_archive_success = true;

    // 2. Archive the LOTS for the auction
    console.log("Archiving the lots for the auction");
    const lots = await LotRepository.search() //
      .where("auction_entity_id")
      .eq(entity_id)
      .return.all();
    for (const lot of lots) {
      lot._id = lot[EntityId as any];
    }
    await LotCollection.insertMany(lots);
    lots_archive_success = true;

    // 3. Archive the FILES for the auction
    console.log("Archiving the files for the auction");
    const auctionFiles = await FileRepository.search() //
      .where("auction_entity_id")
      .eq(entity_id)
      .return.all();
    for (const file of auctionFiles) {
      file._id = file[EntityId as any];
    }
    await FileCollection.insertMany(auctionFiles);
    auction_files_archive_success = true;

    // 4. Archive the FILES for the lots
    console.log("Archiving the files for the lots");
    const allLotFiles = [];
    for (const lot of lots) {
      const lotFiles = await FileRepository.search() //
        .where("lot_entity_id")
        .eq(lot[EntityId as any])
        .return.all();
      for (const file of lotFiles) {
        file._id = file[EntityId as any];
      }
      allLotFiles.push(...lotFiles);
      await FileCollection.insertMany(lotFiles);
    }
    lot_files_archive_success = true;

    // 5. Archive all the bids for the lots
    console.log("Archiving the bids for the lots");
    const allBids = [];
    for (const lot of lots) {
      const bids = await BidRepository.search() //
        .where("lot_entity_id")
        .eq(lot[EntityId as any])
        .return.all();
      for (const bid of bids) {
        bid._id = bid[EntityId as any];
      }
      allBids.push(...bids);
      await BidCollection.insertMany(bids);
    }
    bids_archive_success = true;

    // Now that we have successfully archived the auction, lots, files, and bids, we can delete them from Redis.
    if (
      auction_archive_success && //
      lots_archive_success &&
      auction_files_archive_success &&
      lot_files_archive_success &&
      bids_archive_success
    ) {
      const multi = redisClient.multi();

      multi.json.del(`AUCTION:${entity_id}`);

      for (const lot of lots) {
        multi.json.del(`LOT:${lot[EntityId as any]}`);
      }

      for (const file of auctionFiles) {
        multi.json.del(`FILE:${file[EntityId as any]}`);
      }

      for (const file of allLotFiles) {
        multi.json.del(`FILE:${file[EntityId as any]}`);
      }

      for (const bid of allBids) {
        multi.json.del(`BID:${bid[EntityId as any]}`);
      }

      await multi.exec();
    }
  }

  public async get(_id: string) {
    const auctions = await AuctionCollection.aggregate([
      {
        $match: {
          // _id: new Types.ObjectId(_id),
          _id,
        },
      },
      //get the images and documents for the ausction
      {
        $lookup: {
          from: "files",
          let: { auction_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$auction_entity_id", "$$auction_id"] },
                type: "Image",
              },
            },
          ],
          as: "images",
        },
      },
      {
        $lookup: {
          from: "files",
          let: { auction_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$auction_entity_id", "$$auction_id"] },
                type: "Document",
              },
            },
          ],
          as: "documents",
        },
      },
      //now we need to get the lots for this auction, and pipeline files of type image into the iamges property of the lot
      {
        $lookup: {
          from: "lots",
          let: { auction_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$auction_entity_id", "$$auction_id"] },
              },
            },
            {
              $lookup: {
                from: "files",
                let: { lot_id: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$lot_entity_id", "$$lot_id"] },
                      type: "Image",
                    },
                  },
                ],
                as: "images",
              },
            },
            {
              $lookup: {
                from: "files",
                let: { lot_id: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$lot_entity_id", "$$lot_id"] },
                      type: "Document",
                    },
                  },
                ],
                as: "documents",
              },
            },
            {
              $lookup: {
                from: "bids",
                let: { lot_id: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$lot_entity_id", "$$lot_id"] },
                    },
                  },
                  {
                    $sort: {
                      amount: -1,
                    },
                  },
                ],
                as: "bids",
              },
            },
          ],
          as: "lots",
        },
      },
    ]);

    if (auctions.length == 0) {
      throw new ValidationError("Auction not found.");
    }

    const auction = auctions[0];

    // join the bidders to each lot's bid
    for (const lot of auction.lots) {
      for (const bid of lot.bids) {
        const bidders = await BidderRepository.search() //
          .where("user_entity_id")
          .eq(bid.user_entity_id)
          .all();

        const bidder: any = bidders[0];
        bid.bidder = bidder;

        // join the user to the bidder
        const user = await UserRepository.fetch(bid.user_entity_id);

        bid.user = {
          entity_id: user[EntityId as any],
          name: user.name,
          surname: user.surname,
        };
      }
    }

    auction.number_of_lots = auction.lots.length;
    auction.number_of_bids = auction.lots.reduce((acc, lot) => acc + lot.bids.length, 0);
    auction.highest_bids_combined = auction.lots.reduce((acc, lot) => {
      const highestBid = lot.bids[0];
      if (highestBid) {
        acc += highestBid.amount;
      }
      return acc;
    }, 0);

    return auction;
  }

  public async archivedAuctionsForClient(client_entity_id: string) {
    const client = await ClientRepository.fetch(client_entity_id);
    if (!client.name) {
      throw new ValidationError("Client not found.");
    }

    const auctions = await AuctionCollection.aggregate([
      {
        $match: {
          client_entity_id: client_entity_id,
        },
      },
      //get the first image for the auction
      {
        $lookup: {
          from: "files",
          let: { auction_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$auction_entity_id", "$$auction_id"] },
                type: "Image",
              },
            },
            { $limit: 1 },
          ],
          as: "images",
        },
      },
    ]);

    return auctions;
  }

  public async restore(_id: string) {
    let auction_restore_success = false;
    let lots_restore_success = false;
    let auction_files_restore_success = false;
    let lot_files_restore_success = false;
    let bids_restore_success = false;

    const auction = await AuctionCollection.findById(_id);
    if (!auction) {
      throw new ValidationError("Auction not found in Mongo. Therefore, we cannot restore it into Redis.");
    }

    // 1. Restore the AUCTION
    console.log("Restoring the auction", _id);
    await AuctionRepository.save({
      ...auction.toObject(),
      [EntityId as any]: _id,
      restored_at: new Date(),
      archived_at: null,
    });
    auction_restore_success = true;

    // 2. Restore the LOTS for the auction
    console.log("Restoring the lots for the auction");
    const lots = await LotCollection.find({
      auction_entity_id: _id,
    });
    const multiLots = redisClient.multi();
    for (const lot of lots) {
      console.log("Restoring lot", lot._id);
      multiLots.json.set(`LOT:${lot._id}`, "$", {
        ...lot.toObject(),
        updated_at: moment().unix(),
        created_at: moment(lot.created_at).unix(),
      });
    }
    await multiLots.exec();
    lots_restore_success = true;

    // 3. Restore the FILES for the auction
    console.log("Restoring the files for the auction");
    const auctionFiles = await FileCollection.find({
      auction_entity_id: _id,
    });
    const multiAuctionFiles = redisClient.multi();
    for (const file of auctionFiles) {
      multiAuctionFiles.json.set(`FILE:${file._id}`, "$", {
        ...file.toObject(),
        created_at: moment(file.created_at).unix(),
      });
    }
    await multiAuctionFiles.exec();
    auction_files_restore_success = true;

    // 4. Restore the FILES for the lots
    console.log("Restoring the files for the lots");
    const allLotFiles = await FileCollection.find({
      lot_entity_id: {
        $in: lots.map((lot) => lot._id),
      },
    });
    const multiLotFiles = redisClient.multi();
    for (const file of allLotFiles) {
      multiLotFiles.json.set(`FILE:${file._id}`, "$", {
        ...file.toObject(),
        created_at: moment(file.created_at).unix(),
      });
    }
    await multiLotFiles.exec();
    lot_files_restore_success = true;

    // 5. Restore all the bids for the lots
    console.log("Restoring the bids for the lots");
    const allBids = await BidCollection.find({
      lot_entity_id: {
        $in: lots.map((lot) => lot._id),
      },
    });
    const multiBids = redisClient.multi();
    for (const bid of allBids) {
      multiBids.json.set(`BID:${bid._id}`, "$", {
        ...bid.toObject(),
        created_at: moment(bid.created_at).unix(),
      });
    }
    await multiBids.exec();
    bids_restore_success = true;

    // Now that we have successfully restored the auction, lots, files, and bids, we can delete them from Mongo.
    if (
      auction_restore_success && //
      lots_restore_success &&
      auction_files_restore_success &&
      lot_files_restore_success &&
      bids_restore_success
    ) {
      await AuctionCollection.deleteOne({
        _id: _id,
      });

      await LotCollection.deleteMany({
        auction_entity_id: _id,
      });

      await FileCollection.deleteMany({
        auction_entity_id: _id,
      });

      await FileCollection.deleteMany({
        lot_entity_id: {
          $in: lots.map((lot) => lot._id),
        },
      });

      await BidCollection.deleteMany({
        lot_entity_id: {
          $in: lots.map((lot) => lot._id),
        },
      });
    }
  }

  public async delete(_id: string) {
    const auction = await AuctionCollection.findById(_id);
    if (!auction) {
      throw new ValidationError("Archived auction not found! Cannot delete it.");
    }

    await AuctionCollection.deleteOne({
      _id: _id,
    });

    await LotCollection.deleteMany({
      auction_entity_id: _id,
    });

    await FileCollection.deleteMany({
      auction_entity_id: _id,
    });

    const lots = await LotCollection.find({
      auction_entity_id: _id,
    });

    await FileCollection.deleteMany({
      lot_entity_id: {
        $in: lots.map((lot) => lot._id),
      },
    });

    await BidCollection.deleteMany({
      lot_entity_id: {
        $in: lots.map((lot) => lot._id),
      },
    });

    return true;
  }
}
