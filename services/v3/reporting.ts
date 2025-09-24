import { Service } from "typedi";
import { LotRepository } from "../../schemas/redis/lot";
import { AuctionRepository } from "../../schemas/redis/auction";
import ValidationError from "../../helpers/validation_error";
import { BidRepository } from "../../schemas/redis/bid";
import { EntityId } from "redis-om";
import { ClientRepository } from "../../schemas/redis/client";
import { UserRepository } from "../../schemas/redis/user";
import { BidderRepository } from "../../schemas/redis/bidder";
import { getSystemUserByEntityId, isSystemUser, isVendorUser } from "../../config/floor_entities";
import json2csv from "json2csv";
import { FileRepository } from "../../schemas/redis/file";
import { BID_ACTIVE } from "../../helpers/constants/bid_enums";

@Service()
export class ReportingService3 {
  public async auctionReport(entity_id: string) {
    const auction = await AuctionRepository.fetch(entity_id);
    if (!auction) {
      throw new ValidationError("Auction not found");
    }

    const client = await ClientRepository.fetch(auction.client_entity_id.toString());
    if (!client) {
      throw new ValidationError("Client not found");
    }

    const usersForClient = await UserRepository.search() //
      .where("client_entity_id")
      .eq(client[EntityId as any])
      .return.all();

    const biddersForClient = await BidderRepository.search() //
      .where("client_entity_id")
      .eq(client[EntityId as any])
      .return.all();

    const lotsForAuction = await LotRepository.search() //
      .where("auction_entity_id")
      .eq(entity_id)
      .sortBy("lot_number", "ASC")
      .return.all();

    let highestBidTotal = 0;
    let numberOfBids = 0;

    const lotsBidsUsersBidders = [];
    for (const l of lotsForAuction) {
      // Get all bids for the lot
      const bidsForLot = await BidRepository.search() //
        .where("lot_entity_id")
        .eq(l[EntityId as any])
        .sortBy("amount", "DESC")
        .return.all();

      highestBidTotal += parseFloat((bidsForLot[0]?.amount ?? 0).toString());
      numberOfBids += bidsForLot.length;

      for (const bid of bidsForLot) {
        bid.entity_id = bid[EntityId as any];

        // Check if this is a system user
        if (isSystemUser(bid.user_entity_id.toString())) {
          const system_user = getSystemUserByEntityId(bid.user_entity_id.toString());

          bid.user = {
            entity_id: system_user.entity_id,
            name: system_user.name,
            surname: system_user.surname,
            email: system_user.email,
            cell_phone: {
              calling_code: "+27",
              country_code: "ZA",
              number: "0000000000",
            },
          };

          bid.bidder = {
            entity_id: system_user.entity_id,
            paddle_number: system_user.paddle_number,
            name: system_user.name,
            surname: system_user.surname,
          };

          continue;
        }

        // Otherwise proceed with the normal flow...
        // Join the user to the bid
        const user = usersForClient.find((usr) => usr[EntityId as any] === bid.user_entity_id);
        if (user) {
          delete user.password;
          delete user.salt;
          bid.user = user;
        } else {
          bid.user = {
            entity_id: bid.user_entity_id,
            name: "<unknown>",
            surname: "<unknown>",
            email: "<unknown>",
            cell_phone: {
              calling_code: "+27",
              country_code: "ZA",
              number: "0000000000",
            },
          };
        }
        // Join the bidder to the bid
        const bidder = biddersForClient.find((bdr) => bdr.user_entity_id === bid.user_entity_id);
        bid.bidder = bidder;
      }

      lotsBidsUsersBidders.push({ ...l, entity_id: l[EntityId as any], bids: bidsForLot });
    }

    return {
      number_of_lots: lotsForAuction.length,
      number_of_bids: numberOfBids,
      highest_bids_combined: highestBidTotal,
      auction: {
        ...auction,
        entity_id: auction[EntityId as any],
      }, //
      lots: lotsBidsUsersBidders,
    };
  }

  public async auctionReportCSV(entity_id: string) {
    try {
      const record = await this.auctionReport(entity_id);

      const { auction, lots, highest_bids_combined, number_of_bids, number_of_lots }: any = record;

      const auctionCSV = json2csv.parse({
        entity_id: auction.entity_id,
        title: auction.title,
        // description: auction.description,
        type: auction.type,
        status: auction.status,
      });

      const totalsCSV = json2csv.parse({
        "Number of Lots Lots": number_of_lots,
        "Number of Bids Placed": number_of_bids,
        "Highest Bids Combined": highest_bids_combined,
      });

      let lotCSV = "";
      lots.map((lot: any, lotIdx: number) => {
        const l = { ...lot };
        delete l.bids;

        lotCSV += `\nLOT #${lotIdx + 1}\n${json2csv.parse({
          "": "",
          entity_id: l.entity_id,
          title: l.title,
          // description: l.description,
          status: l.status,
        })}`;

        lot.bids.map((bid: any, bidIdx: number) => {
          const b = {
            "": bidIdx + 1,
            entity_id: bid.entity_id,
            paddle_number: bid.bidder?.paddle_number ?? "<unknown>",
            amount: bid.amount,
            status: bid.status,
            bidder: `${bid.user?.name ?? "<unknown>"} ${bid.user?.surname ?? "<unknown>"}`,
            phone: `${bid.user.cell_phone.calling_code}${bid.user?.cell_phone.number ?? "<unknown>"}`,
            email: bid.user?.email ?? "<unknown>",
          };
          lotCSV += `\n${bidIdx == 0 ? "\nBIDS\n" : ""}${json2csv.parse(b, { header: bidIdx == 0 })}`;
        });

        lotCSV += `\n\n`;
      });

      const csv = `\nAUCTION\n${auctionCSV}\n\nTOTALS\n${totalsCSV}\n\n${lotCSV}`;
      console.log(csv);

      return csv;
    } catch (error) {
      throw new Error(error);
    }
  }

  async auctionSummary(entity_id: string) {
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
    auction.images = images;

    const documents = await FileRepository.search() //
      .where("auction_entity_id")
      .eq(entity_id)
      .and("type")
      .eq("Document")
      .return.all();
    auction.documents = documents;

    const lots = await LotRepository.search() //
      .where("auction_entity_id")
      .eq(entity_id)
      .sortBy("lot_number", "ASC")
      .return.all();

    const lotsWithBids = [];
    for (const lot of lots) {
      const highestBid = await BidRepository.search() //
        .where("lot_entity_id")
        .eq(lot[EntityId as any])
        .and("status")
        .eq(BID_ACTIVE)
        .sortBy("amount", "DESC")
        .return.first();

      const firstImage = await FileRepository.search() //
        .where("lot_entity_id")
        .eq(lot[EntityId as any])
        .and("type")
        .eq("Image")
        .sortBy("order", "ASC")
        .return.first();

      let obj: any = {
        lot: {
          // ...lot,
          lot_number: lot.lot_number,
          title: lot.title,
          entity_id: lot[EntityId as any],
          status: lot.status,
          images: [firstImage],
        },
      };

      if (highestBid) {
        console.log("highestBid", highestBid);
        // const user = await UserRepository.fetch(highestBid.user_entity_id.toString());

        const bidder = await BidderRepository.search() //
          .where("user_entity_id")
          .eq(highestBid.user_entity_id.toString())
          .return.first();

        const userEntityID = highestBid.user_entity_id.toString();

        obj.summary = {
          highest_bid: highestBid.amount,
        };

        if (isSystemUser(userEntityID)) {
          const system_user = getSystemUserByEntityId(userEntityID);

          obj.summary = {
            ...obj.summary,
            bidder: {
              entity_id: userEntityID, // Yes, this is correctly set to the system entity_id, for the bidder entity_id.
              paddle_number: system_user.paddle_number,
            },
            user: {
              entity_id: system_user.entity_id,
            },
          };
        } else {
          obj.summary = {
            ...obj.summary,
            bidder: bidder && {
              entity_id: bidder[EntityId as any],
              paddle_number: bidder.paddle_number,
            },
            user: {
              entity_id: userEntityID,
            },
          };
        }

        lotsWithBids.push(obj);
      } else {
        lotsWithBids.push({
          ...obj,
          summary: {
            bidder: null,
            highest_bid: null,
            user: null,
          },
        });
      }
    }

    return {
      auction: {
        ...auction,
        entity_id: auction[EntityId as any],
      },
      lots: lotsWithBids,
    };
  }
}
