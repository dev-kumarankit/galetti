import { Container, Service } from "typedi";
import { EntityId } from "redis-om";
import ValidationError from "../../helpers/validation_error";
import { UserRepository } from "../../schemas/redis/user";
import { IBidder } from "../../models/bidder";
import { BidderRepository } from "../../schemas/redis/bidder";
import { getULID, redisClient } from "../../integration/redis/redis";
import { RealTimeCommunication } from "../../helpers/real_time_communication";
import { FileRepository } from "../../schemas/redis/file";
import moment from "moment-timezone";
import {
  getSystemUserByEntityId,
  isSystemUser,
  SYSTEM_USERS,
} from "../../config/floor_entities";
import { BidRepository } from "../../schemas/redis/bid";
import { BID_ACTIVE } from "../../helpers/constants/bid_enums";
import { AuctionRepository } from "../../schemas/redis/auction";

interface IGeneratePaddleNumber {
  client_entity_id: string;
}

@Service()
export class BidderService3 {
  private rtc_di = Container.get(RealTimeCommunication);

  /**
   * Generate a unique paddle number for a bidder.\
   * The paddle number is unique to the client.\
   * It is a 4 digit number.\
   * It cannot be the same as the FLOOR_PADDLE_NUMBER.\
   * It cannot be the same as any other bidder's paddle number.
   * @param client_entity_id
   * @returns
   */
  public async generatePaddleNumber({
    client_entity_id,
  }: IGeneratePaddleNumber): Promise<string> {
    // get all existing bidders
    const existingBiddersForClient = await BidderRepository.search()
      .where("client_entity_id") //
      .eq(client_entity_id)
      .return.all();

    const allPaddleNumbers: string[] = existingBiddersForClient.map((b) =>
      b.paddle_number.toString()
    );
    // const floor_users = ALL_FLOOR_USERS;

    let paddleNumber: string;
    do {
      // random number between 0001 and 9999
      paddleNumber = (Math.floor(Math.random() * 9999) + 1).toString();
      // } while (allPaddleNumbers.includes(paddleNumber) || paddleNumber === FLOOR_PADDLE_NUMBER);
    } while (
      allPaddleNumbers.includes(paddleNumber) ||
      SYSTEM_USERS.some((fu) => fu.paddle_number === paddleNumber)
    );
    // pad with zeros to make it 4 digits
    const paddedPaddleNumber: string = paddleNumber.toString().padStart(4, "0");
    return paddedPaddleNumber;
  }

   public async register(id_number: string, address: string, bidder: IBidder,fullname: string, email: string,cell_phone: number) {
    // check if bidder is not already registered
    const existingBidder = bidder.registered_auction_id
      ? await BidderRepository.search()
          .where("client_entity_id")
          .eq(bidder.client_entity_id)
          .and("user_entity_id")
          .eq(bidder.user_entity_id)
          .and("registered_auction_id")
          .eq(bidder.registered_auction_id)
          .return.first()
      : await BidderRepository.search()
          .where("client_entity_id")
          .eq(bidder.client_entity_id)
          .and("user_entity_id")
          .eq(bidder.user_entity_id)
          .return.first();
    if (bidder.registered_auction_id) {
      const auction = await AuctionRepository.fetch(
        bidder.registered_auction_id
      );
      if (!auction.client_entity_id) {
        throw new ValidationError("Auction not found.");
      }
    }

    if (existingBidder?.client_entity_id) {
      throw new ValidationError(`You have already registered as a bidder.`);
    }

    const existingUser = await UserRepository.fetch(bidder.user_entity_id);
    if (!existingUser.client_entity_id) {
      throw new ValidationError("User not found!");
    }

    bidder.paddle_number = await this.generatePaddleNumber({
      client_entity_id: existingUser.client_entity_id.toString(),
    });

    // TODO: RIGHT HERE, we still have the possibility of a paddle_number collision.
    //       Redis just makes it less likely because of its speed.

    const objToSave: IBidder = {
      ...bidder,
      is_verified: false, // we're registering, this must be false here
      created_at: moment().tz("Africa/Johannesburg").unix(),
      fullname: fullname,
      email: email,
      cell_phone: cell_phone
    };

    const newHashKey = `${"BIDDER:"}${getULID()}`;

    const multi = redisClient.multi();
    multi.json.set(newHashKey, "$", objToSave); // save the bidder
    multi.json.set(`USER:${bidder.user_entity_id}`, "$", {
      ...existingUser,
      id_number,
      address,
      fullname: fullname,
      email: email,
      cell_phone: cell_phone
    }); // save the user with id_number and address
    multi.exec();

    const obr = {
      // ob = object bidder
      entity_id: newHashKey.replace("BIDDER:", ""),
      // ...br,
      ...objToSave,
    };

    console.log("Bidder Registered!", obr);
    return obr;
  }

  public async update(entity_id: string, id_number: string, address: string, fullname: any, email: any,cell_number:any) {
    const bidder = await BidderRepository.fetch(entity_id);

    if (!bidder.client_entity_id) {
      throw new ValidationError("Bidder not found!");
    }

    const user = await UserRepository.fetch(bidder.user_entity_id.toString());

    if (!user.client_entity_id) {
      throw new ValidationError("User could not be found for this bidder!");
    }

    const updatedAt = moment().tz("Africa/Johannesburg").unix();

    await UserRepository.save({
      ...user,
      id_number,
      address,
      fullname,
      email,
      cell_number,
      updated_at: updatedAt,
    });

    const updatedBidder = await BidderRepository.save({
      ...bidder,
      updated_at: updatedAt,
    });

    const obr = {
      // ob = object bidder
      ...updatedBidder,
      entity_id: updatedBidder[EntityId as any],
    };

    return obr;
  }

  public async verification(entity_id: string, verified: boolean) {
    const bidder = await BidderRepository.fetch(entity_id);

    if (!bidder.client_entity_id) {
      throw new ValidationError("Bidder not found!");
    }

    // const user_id = bidder.user_entity_id;

    bidder.is_verified = verified;
    await BidderRepository.save(bidder);

    this.rtc_di.broadcastVerifyBidder(bidder.user_entity_id.toString(), {
      client_entity_id: bidder.client_entity_id.toString(),
      is_verified: verified,
    });

    const obr = {
      // ob = object bidder
      ...bidder,
      entity_id: entity_id,
    };

    return obr;
  }

  public delete(entity_id: string) {
    return BidderRepository.remove(entity_id);
  }

  public async deleteAllBidders(client_entity_id: string) {
    const bidders = await BidderRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .return.all();

    const multi = redisClient.multi();
    for (const b of bidders) {
      multi.json.del(`BIDDER:${b[EntityId as any]}`);
    }
    multi.exec();
  }

  public async unverifyAllBidders(client_entity_id: string) {
    const bidders = await BidderRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .return.all();

    const multi = redisClient.multi();
    for (const b of bidders) {
      b.is_verified = false;
      multi.json.set(`BIDDER:${b[EntityId as any]}`, "$", {
        ...b,
        created_at: moment(b.created_at.toString())
          .tz("Africa/Johannesburg")
          .unix(),
        updated_at: moment().tz("Africa/Johannesburg").unix(),
      });
    }
    multi.exec();
  }

  public async biddersForClient({ client_entity_id, auction_entity_id }: any) {
    let bidders;

    if (auction_entity_id) {
      bidders = await BidderRepository.search()
        .where("client_entity_id")
        .eq(client_entity_id)
        .where("registered_auction_id")
        .eq(auction_entity_id)
        .return.all();
    } else {
      bidders = await BidderRepository.search()
        .where("client_entity_id")
        .eq(client_entity_id)
        .return.all();
    }
    if (!bidders) {
      return "please enter the valid data";
    }
    const user_ids = bidders.map((b) => b.user_entity_id.toString());
    const users = await UserRepository.fetch(user_ids);

    const biddersWithUsers: any = [];
    for (const b of bidders) {
      const user = users.find((u) => u[EntityId as any] === b.user_entity_id);

      const files = await FileRepository.search() //
        .where("bidder_entity_id")
        .eq(b[EntityId as any])
        .and("type")
        .eq("Document")
        .return.all();

      biddersWithUsers.push({
        ...b,
        entity_id: b[EntityId as any],
        has_docs:
          files.findIndex((f) => f.custom_name === "proof_of_id") > -1 &&
          files.findIndex((f) => f.custom_name === "proof_of_address") > -1,
        user: user
          ? {
              //
              name: user.name,
              surname: user.surname,
              email: user.email,
              cell_phone: user.cell_phone,
              id_number: user.id_number,
              address: user.address,
            }
          : null,
      });
    }

    biddersWithUsers.sort((a, b) => {
      // if (a.user?.email < b.user?.email) {
      //   return -1;
      // }
      // if (a.user?.email > b.user?.email) {
      //   return 1;
      // }
      // return 0;

      // sort by created_at from new to old
      return moment(a.created_at).isBefore(b.created_at) ? 1 : -1;
    });

    return biddersWithUsers;
  }

  public async unregisteredBiddersForClient(client_entity_id: string) {
    const allUsersforClient = await UserRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .return.all();

    const allBiddersforClient = await BidderRepository.search() //
      .where("client_entity_id")
      .eq(client_entity_id)
      .return.all();

    // get all users that are not registered. they are un-registered if they are not inside allBiddersforClient
    const unregisteredUsers = allUsersforClient.filter((ufc) => {
      return !allBiddersforClient.find(
        (bfc) => bfc.user_entity_id === ufc[EntityId as any]
      );
    });

    // only return what is needed. mainly to avoid sending back the password, salt, etc
    const users = unregisteredUsers.map((u) => {
      return {
        entity_id: u[EntityId as any],
        name: u.name,
        surname: u.surname,
        email: u.email,
        // cell_phone: u.cell_phone,
      };
    });

    return users;
  }

  public async regeneratePaddleNumber(bidder_entity_id: string) {
    const bidder = await BidderRepository.fetch(bidder_entity_id);

    if (!bidder.client_entity_id) {
      throw new ValidationError("Bidder not found!");
    }

    const existingUser = await UserRepository.fetch(
      bidder.user_entity_id.toString()
    );
    if (!existingUser.client_entity_id) {
      throw new ValidationError("User not found!");
    }

    bidder.paddle_number = await this.generatePaddleNumber({
      client_entity_id: existingUser.client_entity_id.toString(),
    });
    await BidderRepository.save(bidder);

    const obr = {
      // ob = object bidder
      ...bidder,
      entity_id: bidder_entity_id,
    };

    console.log("Bidder Paddle Number Regenerated!", obr);

    return obr;
  }

  public async get(entity_id: string) {
    const bidder = await BidderRepository.fetch(entity_id);

    if (!bidder.client_entity_id) {
      throw new ValidationError("Bidder not found!");
    }

    const user = await UserRepository.fetch(bidder.user_entity_id.toString());

    if (!user.client_entity_id) {
      throw new ValidationError("User could not be found for this bidder!");
    }

    // get the files for this bidder
    const files = await FileRepository.search() //
      .where("bidder_entity_id")
      .eq(entity_id)
      // created at from new to old
      .sortBy("created_at", "DESC") // bidder can potentially upload multiple versions of files, we want the latest.
      .return.all();

    // we want to return one proof file for id_number and one for address
    // this code also returns the latest uploaded file becuase of the sortBy above
    const proof_of_id_file = files.find((f) => f.custom_name === "proof_of_id");
    const proof_of_address_file = files.find(
      (f) => f.custom_name === "proof_of_address"
    );

    const obr = {
      // ob = object bidder
      ...bidder,
      entity_id: entity_id,
      user: {
        entity_id: bidder.user_entity_id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        cell_phone: user.cell_phone,
        id_number: user.id_number,
        address: user.address,
      },
      [(proof_of_id_file?.custom_name ?? "proof_of_id").toString()]:
        proof_of_id_file && {
          ...proof_of_id_file,
          entity_id: proof_of_id_file[EntityId as any],
        },
      [(proof_of_address_file?.custom_name ?? "proof_of_address").toString()]:
        proof_of_address_file && {
          ...proof_of_address_file,
          entity_id: proof_of_address_file[EntityId as any],
        },
    };

    return obr;
  }

  async status(payload: any) {
    const { client_entity_id, user_entity_id, auction_entity_id } = payload;
    const bidder = auction_entity_id
      ? await BidderRepository.search() //
          .where("client_entity_id")
          .eq(client_entity_id)
          .and("user_entity_id")
          .eq(user_entity_id)
          .and("registered_auction_id")
          .eq(auction_entity_id || "")
          .return.first()
      : await BidderRepository.search() //
          .where("client_entity_id")
          .eq(client_entity_id)
          .and("user_entity_id")
          .eq(user_entity_id)
          .return.first();

    if (!bidder?.client_entity_id) {
      return {
        is_registered: false,
        is_verified: false,
        has_proof_of_id: false,
        has_proof_of_address: false,
        bidder: {
          entity_id: null,
          paddle_number: null,
        },
      };
    }

    const files = await FileRepository.search() //
      .where("bidder_entity_id")
      .eq(bidder[EntityId as any])
      .return.all();

    const has_proof_of_id =
      files.findIndex((f) => f.custom_name === "proof_of_id") > -1;
    const has_proof_of_address =
      files.findIndex((f) => f.custom_name === "proof_of_address") > -1;

    const is_registered = bidder ? true : false;
    let registeredAuctionIds: any = new Set<string>();
    const is_verified = bidder?.is_verified ?? false;
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
      is_registered: registeredAuctionIds.has(auction_entity_id),
      is_verified,
      has_proof_of_id,
      has_proof_of_address,
      bidder: {
        entity_id: bidder?.[EntityId as any],
        paddle_number: bidder?.paddle_number,
      },
    };
  }

  async activeBiddersForLot(lot_entity_id: string) {
    // we need to find only the bidders who placed bids on this lot

    // first, lets find all bids for this lot.
    // secondly we need to loop over the bids, and find the user and bidder for each bid.
    // we want to accumulate unique bidders tht has palced bids on this lot becuase one user might have placed multiple bids.

    const bids = await BidRepository.search() //
      .where("lot_entity_id")
      .eq(lot_entity_id)
      .and("status")
      .eq(BID_ACTIVE)
      .return.all();

    const detectedBidders: any = [];

    for (const bid of bids) {
      const existingBidder = detectedBidders.find(
        (b: any) => b.user.entity_id === bid.user_entity_id.toString()
      );
      if (existingBidder) {
        continue; // no need to add the same bidder again
      }

      // if this is the floor user
      if (isSystemUser(bid.user_entity_id.toString())) {
        const system_user = getSystemUserByEntityId(
          bid.user_entity_id.toString()
        );

        detectedBidders.push({
          bidder: {
            entity_id: system_user.entity_id,
            paddle_number: system_user.paddle_number,
          },
          user: {
            entity_id: system_user.entity_id,
            name: system_user.name,
            surname: system_user.surname,
          },
        });
        continue;
      }

      const userForBid = await UserRepository.fetch(
        bid.user_entity_id.toString()
      );

      if (userForBid.client_entity_id) {
        // const bidder = await BidderRepository.fetch(userForBid[EntityId as any]);
        const bidder = await BidderRepository.search() //
          .where("user_entity_id")
          .eq(userForBid[EntityId as any])
          .return.first();

        if (bidder.user_entity_id) {
          detectedBidders.push({
            bidder: {
              entity_id: bidder[EntityId as any],
              paddle_number: bidder.paddle_number,
            },
            user: {
              entity_id: userForBid[EntityId as any],
              name: userForBid.name,
              surname: userForBid.surname,
            },
          });
        }
      }
    }

    return detectedBidders;
  }
}
