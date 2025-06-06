import { Container, Service } from "typedi";
import { EntityId } from "redis-om";
import { IBid } from "../../models/bid";
import { LotRepository } from "../../schemas/redis/lot";
import ValidationError from "../../helpers/validation_error";
import { BidRepository } from "../../schemas/redis/bid";
import { UserRepository } from "../../schemas/redis/user";
import { LOT_BIDDING_OPEN } from "../../helpers/constants/lot_enums";
import { BidderRepository } from "../../schemas/redis/bidder";
import { RealTimeCommunication } from "../../helpers/real_time_communication";
import { BID_ACTIVE, BID_REJECTED } from "../../helpers/constants/bid_enums";
import { AuctionRepository } from "../../schemas/redis/auction";
import moment from "moment-timezone";
import { redisClient } from "../../integration/redis/redis";
import {
  FLOOR_USER,
  getRandomVendorUser,
  getSystemUserByEntityId,
  isSystemUser,
} from "../../config/floor_entities";
import { FirebaseService3 } from "./firebase";
import { formatMoney } from "../../helpers/constants/format_money";

interface IObjBid {
  count: number;
  // TODO fix the "any" types
  bid: {
    entity_id: string;
    amount: any;
    created_at: any;
    status: any;
    user: {
      entity_id: string;
      name: string;
      surname: string;
    };
    bidder: {
      entity_id: string;
      paddle_number: string;
      is_verified: boolean;
    };
    lot: {
      entity_id: string;
      lot_number: any;
      title: any;
    };
  };
}

@Service()
export class BidService3 {
  private rtc_di = Container.get(RealTimeCommunication);
  private firebaseService = Container.get(FirebaseService3);

  public async placeBid(bid: IBid) {
    // check if the lot exists
    const lot = await LotRepository.fetch(bid.lot_entity_id);
    if (!lot.auction_entity_id) {
      throw new ValidationError("Lot not found!");
    }

    // check if the lot is open for bidding
    if (lot.status !== LOT_BIDDING_OPEN) {
      throw new ValidationError("This lot is not open for bidding!");
    }

    // check if the user exists
    const user = await UserRepository.fetch(bid.user_entity_id);
    if (!user.client_entity_id) {
      throw new ValidationError("User not found!");
    }

    // check if the user is a verified bidder
    const bidder = await BidderRepository.search()
      .where("user_entity_id")
      .eq(bid.user_entity_id)
      .where("registered_auction_id")
      .eq(lot.auction_entity_id)
      .return.first();

    if (!bidder?.is_verified) {
      throw new ValidationError("You are not a verified bidder!");
    }

    const highestBid = await BidRepository.search() //
      .where("lot_entity_id")
      .eq(bid.lot_entity_id)
      .and("status")
      .eq(BID_ACTIVE)
      .sortBy("amount", "DESC")
      .return.first();

    if (bid.increment) {
      const highest = parseFloat((highestBid?.amount ?? 0).toString());
      // mutate the bid amount to be the highest + increment to 2 decimal places
      bid.amount = parseFloat(
        (highest + parseFloat(bid.increment.toString())).toFixed(2)
      );
      if (
        parseFloat(bid.amount.toString()) <
        (lot?.starting_price ? parseFloat(lot.starting_price) : 0)
      ) {
        throw new ValidationError(
          `Your bid amount must be more than ${
            lot?.starting_price ? lot.starting_price : 0
          }`
        );
      }
    } else {
      if (
        parseFloat(bid.amount.toString()) <
        (lot?.starting_price ? parseFloat(lot.starting_price) : 0)
      ) {
        throw new ValidationError(
          `Your bid amount must be more than ${
            lot?.starting_price ? lot.starting_price : 0
          }`
        );
      }
      // can only place bid if its higher than the current highest amount
      if (highestBid) {
        if (bid.amount <= parseFloat(highestBid.amount.toString())) {
          // amount must be higher than the highest bid.
          throw new ValidationError(
            `You've been outbid! Your bid amount must be more than ${formatMoney(
              {
                value: highestBid.amount.toString(),
              }
            )}. Please refresh your screen if the problem persists.`
          );
        }

        if (highestBid.user_entity_id === bid.user_entity_id) {
          // you cannot outbid yourself
          // throw new ValidationError("You cannot outbid yourself!"); // Joff said we should not throw an error here and allow the user to place the bid against himself.
        } else if (highestBid.user_entity_id !== bid.user_entity_id) {
          // we must also check if the previous (highest bid) is this the same user nor not.
          // if it is the same user, we must not send a notification to the user.
          // if it is not the same user, we must send an outbid notification to the previous user.

          // do not even try to send a notification to a system user.
          if (isSystemUser(highestBid.user_entity_id.toString()) == false) {
            this.firebaseService.sendNotificationToUsers(
              {
                notification: {
                  title: "Outbid!",
                  body: `You have been outbid on lot #${lot.lot_number} - ${lot.title}`,
                },
              },
              [highestBid.user_entity_id.toString()]
            );
          }
        }
      }
    }

    // proceed to place bid in redis
    const obj: IBid = {
      ...bid,
      created_at: moment().tz("Africa/Johannesburg").unix(),
      status: BID_ACTIVE,
    };

    const ob = await BidRepository.save(obj);

    const bidCount = await BidRepository.search() //
      .where("lot_entity_id")
      .eq(bid.lot_entity_id)
      .and("status")
      .eq(BID_ACTIVE)
      .count();

    const obp = {
      count: bidCount,
      bid: {
        entity_id: ob[EntityId],
        amount: ob.amount,
        // created_at: ob.created_at,
        created_at: moment
          .unix(parseFloat(ob.created_at.toString()))
          .tz("Africa/Johannesburg"),
        status: ob.status,
        user: {
          entity_id: user[EntityId],
          name: user.name,
          surname: user.surname,
        },
        bidder: {
          entity_id: bidder[EntityId],
          paddle_number: bidder.paddle_number,
          is_verified: bidder.is_verified,
        },
        lot: {
          entity_id: lot[EntityId],
          lot_number: lot.lot_number,
          title: lot.title,
        },
      },
    };

    // broadcast the bid to the lot
    // this.rtc_di.broadcastNewBid(bid.lot_entity_id, obp);
    this.rtc_di.broadcastNewBid(lot.auction_entity_id.toString(), obp);

    console.log("Bid Placed!", obp);

    return obp;
  }

  public async placeSystemBid(
    lot_entity_id: string,
    increment: number,
    type: "floor" | "vendor"
  ) {
    const lot = await LotRepository.fetch(lot_entity_id);
    if (!lot.auction_entity_id) {
      throw new ValidationError("Lot not found!");
    }

    const last_bid = await BidRepository.search() //
      .where("lot_entity_id")
      .eq(lot_entity_id)
      .and("status")
      .eq(BID_ACTIVE)
      .sortBy("created_at", "DESC")
      .return.first();

    const lastBidAmount = parseFloat((last_bid?.amount ?? 0).toString());

    let system_user = null;
    switch (type) {
      case "floor":
        system_user = FLOOR_USER;
        break;
      case "vendor":
        system_user = getRandomVendorUser();
        break;
    }

    const bid: IBid = {
      lot_entity_id: lot_entity_id,
      user_entity_id: system_user.entity_id,
      amount: lastBidAmount + increment,
      status: BID_ACTIVE,
      created_at: moment().tz("Africa/Johannesburg").unix(),
    };

    console.log("FLOOR is placing an INCREMENTAL bid", bid);

    const b = await BidRepository.save(bid);

    const bidCount = await BidRepository.search() //
      .where("lot_entity_id")
      .eq(bid.lot_entity_id)
      .and("status")
      .eq(BID_ACTIVE)
      .count();

    const obp: IObjBid = {
      count: bidCount,
      bid: {
        entity_id: b[EntityId],
        amount: b.amount,
        created_at: moment
          .unix(parseFloat(b.created_at.toString()))
          .tz("Africa/Johannesburg"),
        status: b.status,
        user: {
          entity_id: system_user.entity_id,
          name: system_user.name,
          surname: system_user.surname,
        },
        bidder: {
          entity_id: system_user.entity_id,
          paddle_number: system_user.paddle_number,
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
    // this.rtc_di.broadcastNewBid(lot_entity_id, obp);
    this.rtc_di.broadcastNewBid(lot.auction_entity_id.toString(), obp);
  }

  public async placeSystemCustomBid(
    lot_entity_id: string,
    amount: number,
    type: "floor" | "vendor"
  ) {
    const lot = await LotRepository.fetch(lot_entity_id);
    if (!lot.auction_entity_id) {
      throw new ValidationError("Lot not found!");
    }

    const last_bid = await BidRepository.search() //
      .where("lot_entity_id")
      .eq(lot_entity_id)
      .and("status")
      .eq(BID_ACTIVE)
      .sortBy("created_at", "DESC")
      .return.first();

    const lastBidAmount = parseFloat((last_bid?.amount ?? 0).toString());

    if (amount <= lastBidAmount) {
      throw new ValidationError(
        "The bid amount must be greater than the current highest bid."
      );
    }

    let system_user = null;
    switch (type) {
      case "floor":
        system_user = FLOOR_USER;
        break;
      case "vendor":
        system_user = getRandomVendorUser();
        break;
    }

    const bid: IBid = {
      lot_entity_id: lot_entity_id,
      user_entity_id: system_user.entity_id, // FLOOR user
      amount: amount,
      status: BID_ACTIVE,
      created_at: moment().tz("Africa/Johannesburg").unix(),
    };

    console.log("FLOOR is placing a CUSTOM bid", bid);

    const b = await BidRepository.save(bid);

    const bidCount = await BidRepository.search() //
      .where("lot_entity_id")
      .eq(bid.lot_entity_id)
      .and("status")
      .eq(BID_ACTIVE)
      .count();

    const obp: IObjBid = {
      count: bidCount,
      bid: {
        entity_id: b[EntityId],
        amount: b.amount,
        created_at: moment
          .unix(parseFloat(b.created_at.toString()))
          .tz("Africa/Johannesburg"),
        status: b.status,
        user: {
          entity_id: system_user.entity_id,
          name: system_user.name,
          surname: system_user.surname,
        },
        bidder: {
          entity_id: system_user.entity_id,
          paddle_number: system_user.paddle_number,
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
    // this.rtc_di.broadcastNewBid(lot_entity_id, obp);
    this.rtc_di.broadcastNewBid(lot.auction_entity_id.toString(), obp);
  }

  public async bidsForLot(
    entity_id: string,
    page: number = 0,
    limit: number = 10
  ) {
    const lot = await LotRepository.fetch(entity_id);
    if (!lot.auction_entity_id) {
      throw new ValidationError("Lot not found!");
    }

    //get the auction for this lot
    const auction = await AuctionRepository.fetch(
      lot.auction_entity_id.toString()
    );
    if (!auction) {
      throw new ValidationError("Auction was not found for this lot!");
    }

    const bids = await BidRepository.search() //
      .where("lot_entity_id")
      .eq(entity_id)
      .and("status")
      .eq(BID_ACTIVE)
      .sortBy("amount", "DESC")
      .return.page(page, limit);

    // console.log("Bids fetched", bids);

    const bidCount = await BidRepository.search() //
      .where("lot_entity_id")
      .eq(entity_id)
      .and("status")
      .eq(BID_ACTIVE)
      .sortBy("amount", "DESC")
      .count();

    const formattedBids = [];
    for (const bid of bids) {
      let usr = null;
      let bdr = null;

      if (isSystemUser(bid.user_entity_id.toString())) {
        const system_user = getSystemUserByEntityId(
          bid.user_entity_id.toString()
        );

        // if the user is the floor user, we hardcode the user details here.
        usr = {
          [EntityId]: system_user.entity_id,
          name: system_user.name,
          surname: system_user.surname,
        };
        bdr = {
          [EntityId]: system_user.entity_id,
          paddle_number: system_user.paddle_number,
          is_verified: true,
        };
      } else {
        // from the user repository, find the user
        const fetchedUser = await UserRepository.fetch(
          bid.user_entity_id.toString()
        );
        if (fetchedUser.client_entity_id) {
          usr = fetchedUser;
          delete usr?.password;
          delete usr?.salt;
        }

        // from bidder repository, find the bidder
        const fetchedBidder = await BidderRepository.search() //
          .where("user_entity_id")
          .eq(bid.user_entity_id.toString())
          .return.first();
        if (fetchedBidder?.client_entity_id) {
          bdr = fetchedBidder;
        }
      }

      formattedBids.push({
        entity_id: bid[EntityId],
        amount: bid.amount,
        created_at: bid.created_at,
        status: bid.status,
        bidder: bdr
          ? {
              entity_id: bdr[EntityId],
              paddle_number: bdr.paddle_number,
              is_verified: bdr.is_verified,
            }
          : {
              entity_id: "Unknown",
              paddle_number: "Unknown",
              is_verified: false,
            },
        user: usr
          ? {
              entity_id: usr[EntityId],
              name: usr?.name,
              surname: usr?.surname,
            }
          : {
              entity_id: "Unknown",
              name: "Unknown",
              surname: "Unknown",
            },
      });
    }

    return {
      count: bidCount,
      bids: formattedBids,
    };
  }

  public async reject(entity_id: string) {
    const bid = await BidRepository.fetch(entity_id);
    if (!bid.user_entity_id) {
      throw new ValidationError("Could not find the bid to reject!");
    }

    const lot = await LotRepository.fetch(bid.lot_entity_id.toString());

    const ob = await BidRepository.save({
      ...bid,
      updated_at: moment().tz("Africa/Johannesburg").unix(),
      status: BID_REJECTED,
    });

    // Send a firebase notification
    this.firebaseService.sendNotificationToUsers(
      {
        notification: {
          title: "Bid Rejected",
          body: `Your bid has been rejected on lot #${lot.lot_number} - ${lot.title}`,
        },
      },
      [bid.user_entity_id.toString()]
    );

    this.rtc_di.broadcastRejectedBid(
      bid.lot_entity_id.toString(),
      bid[EntityId]
    );

    return ob;
  }

  public async backUp(entity_id: string) {
    // the bid with the matching entity_id is the one to become the highest bid
    const bid = await BidRepository.fetch(entity_id);
    if (!bid.user_entity_id) {
      throw new ValidationError("Could not find the bid to back up!");
    }

    const bids = await BidRepository.search() //
      .where("lot_entity_id")
      .eq(bid.lot_entity_id.toString())
      .and("status")
      .eq(BID_ACTIVE)
      .sortBy("amount", "DESC")
      .return.all();

    const lot = await LotRepository.fetch(bid.lot_entity_id.toString());

    const bidsToReject = bids.filter((b) => {
      return (
        parseFloat(b.amount.toString()) > parseFloat(bid.amount.toString())
      );
    });
    const bidsToRejectIDs = bidsToReject.map((b) => b[EntityId]);

    // Send a firebase notification
    const rejectingBidUserIDs = new Set<string>();
    bidsToReject.forEach((b) => {
      rejectingBidUserIDs.add(b.user_entity_id.toString());
    });
    this.firebaseService.sendNotificationToUsers(
      {
        notification: {
          title: "Bid Rejected",
          body: `One or more of your bids have been rejected on lot #${lot.lot_number} - ${lot.title}`,
        },
      },
      [...rejectingBidUserIDs]
    );

    // Broadcast the rejected bids
    this.rtc_di.broadcastBackedUpBids(
      bid.lot_entity_id.toString(),
      bidsToRejectIDs
    );

    // Back-up the bids
    const multi = redisClient.multi();
    for (const b of bidsToReject) {
      multi.json.set(`BID:${b[EntityId]}`, "$", {
        ...b,
        updated_at: moment().tz("Africa/Johannesburg").unix(),
        status: BID_REJECTED,
      });
    }
    multi.exec();

    return bidsToRejectIDs;
  }

  public async deleteAllForLot(lot_entity_id: string) {
    // const lot = await LotRepository.fetch(lot_entity_id);
    // if (!lot.auction_entity_id) {
    //   throw new ValidationError("Lot not found!");
    // }

    const bids = await BidRepository.search() //
      .where("lot_entity_id")
      .eq(lot_entity_id)
      .return.all();

    const multi = redisClient.multi();

    for (const bid of bids) {
      multi.json.del(`BID:${bid[EntityId]}`);
    }

    multi.exec();

    return bids.length;
  }

  public async deleteAllForAuction(auction_entity_id: string) {
    const lots = await LotRepository.search() //
      .where("auction_entity_id")
      .eq(auction_entity_id)
      .return.all();

    let totalDeleted = 0;

    for (const lot of lots) {
      const bidsDeleted = await this.deleteAllForLot(lot[EntityId]);
      totalDeleted += bidsDeleted;
    }

    return totalDeleted;
  }

  public async biddingHistoryForUser(user_entity_id: string) {
    // 1. gather all bids for the user
    // 2. gather all lots for the user based on the bids
    // 3. gather all auctions for the user based on the lots
    // 4. then from bids - lots - auctions, we go auctions - lots - bids

    const bidsForUser = await BidRepository.search() //
      .where("user_entity_id")
      .eq(user_entity_id)
      // .and("status") // we actually want to see all bids, even the rejected ones the user placed.
      // .eq(BID_ACTIVE)
      .return.all();

    const alreadyRetrievedLots: any[] = [];
    const alreadyRetrievedAuctions: any[] = [];

    for (const bidForUser of bidsForUser) {
      bidForUser.entity_id = bidForUser[EntityId];

      let lot = null;
      if (
        alreadyRetrievedLots.findIndex(
          (x) => x[EntityId] === bidForUser.lot_entity_id.toString()
        ) === -1
      ) {
        // here we have not yet retrieved the lot
        lot = await LotRepository.fetch(bidForUser.lot_entity_id.toString());
        if (lot?.auction_entity_id) {
          // get the highest bid for the lot.
          const highestBidForLot = await BidRepository.search() //
            .where("lot_entity_id")
            .eq(bidForUser.lot_entity_id.toString())
            .and("status")
            .eq(BID_ACTIVE) // only active bids can be the highest bid
            .sortBy("amount", "DESC")
            .return.first();

          lot.entity_id = lot[EntityId];
          lot.bids = [];
          lot.highest_bid = highestBidForLot; // and this can be null, or any other user's bid
          alreadyRetrievedLots.push(lot);
        } else {
          lot = null;
        }
      } else {
        lot = alreadyRetrievedLots.find(
          (x) => x[EntityId] === bidForUser.lot_entity_id.toString()
        );
      }

      // admin might have deleted the lot, so we need to perform a truthy check
      if (lot) {
        let auction = null;
        if (
          alreadyRetrievedAuctions.findIndex(
            (x) => x[EntityId] === lot.auction_entity_id.toString()
          ) === -1
        ) {
          // here we have not yet retrieved the auction
          auction = await AuctionRepository.fetch(
            lot.auction_entity_id.toString()
          );
          if (auction?.client_entity_id) {
            auction.entity_id = auction[EntityId];
            auction.lots = [];
            alreadyRetrievedAuctions.push(auction);
          } else {
            auction = null;
          }
        } else {
          auction = alreadyRetrievedAuctions.find(
            (x) => x[EntityId] === lot.auction_entity_id.toString()
          );
        }

        // admin might have deleted the auction, so we need to perform a truthy check
        if (auction) {
          if (
            auction.lots.findIndex((x) => x[EntityId] === lot[EntityId]) === -1
          ) {
            // add the bid we are busy with, to the lot
            lot.bids = [bidForUser];
            auction.lots.push(lot);
            auction.lots.sort((a, b) => {
              // sort by lot number ascending
              return (
                parseFloat(a.lot_number.toString()) -
                parseFloat(b.lot_number.toString())
              );
            });
          } else {
            // add the bid to the lot if it does not exist in there yet
            if (
              lot.bids.findIndex(
                (x) => x[EntityId] === bidForUser[EntityId]
              ) === -1
            ) {
              lot.bids.push(bidForUser);
              lot.bids.sort((a, b) => {
                // sort by amount descending
                return (
                  parseFloat(b.amount.toString()) -
                  parseFloat(a.amount.toString())
                );
              });
            }
          }
        }
      }
    }

    return alreadyRetrievedAuctions;
  }
}
