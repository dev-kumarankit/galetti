import { Server, Socket } from "socket.io";
import { Service, Container } from "typedi";
import { LotService3 } from "../services/v3/lot";

interface IAuctionWentLive {
  entity_id: string;
  title: string;
  description: string;
  status: string;
  type: string;
}

interface IAuctionStatus {
  entity_id: string;
  status: string;
  has_extended_lots: boolean;
}

interface ILotStatus {
  lot_entity_id: string;
  auction_entity_id: string;
  title: string;
  lot_number: number;
  status: string;
  type: string;
  highest_bid: any;
  reserve_price_check?:any
  reserve_price?:any;
}

@Service()
export class RealTimeCommunication {
  public clientSequenceMap = new Map();
  private io: Server = null;

  public initialize(httpServer: any) {
    console.info(`Initializing RTC...`);
    this.io = new Server(httpServer);

    // this.io.joi;

    this.io.on("connection", (client) => {
      console.log("websocket - new client successfully connected:", client.id);

      this.clientSequenceMap.set(client.id, {
        user_id: "", //Empty on connection. We have no idea who connected yet.
        auction_id: "",
        lot_id: "",
        // client_id: client.id,
      });

      //Used by the client to tell us their user_id and auction.
      client.on("setUserAndJoinLotPipe", (data) => {
        const { user_id, client_id, auction_id, lot_id } = data;
        //Override with data from Flutter to we can identify users later.
        console.log("websocket - client responded with data:", data);
        this.clientSequenceMap.set(client.id, {
          user_id: user_id,
          auction_id: auction_id,
          lot_id: lot_id,
        });

        //And then
        client.join([lot_id, auction_id]);
      });

      //Client disconnection event.
      client.on("disconnect", () => {
        console.log("websocket - client has disconnected:", client.id);
        this.clientSequenceMap.delete(client.id);
      });

      // New events used by web bidding screens.
      client.on("joinLotPipe", (lot_id: string) => {
        client.join(lot_id);
        console.log("client executed joinLotPipe");
      });

      // For now only used by the automated admin screen.
      client.on("joinAllLotsPipes", async (auction_entity_id: string) => {
        // get lots by auction_id
        const lotServiceInstance = Container.get(LotService3);
        const lots = await lotServiceInstance.lotsForAuction(auction_entity_id, false);

        client.join(lots.map((lot) => lot.entity_id.toString()));

        console.log("client executed joinAllLotsPipes");
      });

      client.on("joinUserPipe", (user_id: string) => {
        client.join(user_id);
        console.log("client executed joinUserPipe");
      });

      client.on("joinClientPipe", (client_entity_id: string) => {
        client.join(client_entity_id);
        console.log("client executed joinClientPipe");
      });

      client.on("joinAuctionPipe", (auction_id: string) => {
        client.join(auction_id);
        console.log("client executed joinAuctionPipe");
      });

      // Think this is not being used anymore.
      client.on("leaveLotPipe", (lot_id: string) => {
        client.leave(lot_id);
        console.log("client executed leaveLotPipe");
      });
    });

    console.info(`Successfully initialized RTC!`);
  }

  // deprecated
  public broadcastBidsToLot(lot_id: string, newBid: any) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!", lot_id);
    } else {
      // const socket = this.findSocketForLot(lot_id);

      // if (socket) {
      //  console.log("websocket - attempting to emit to lot_id:", lot_id);
      //   socket.in(lot_id).emit("newBid", newBid);
      // }

      this.io.to(lot_id).emit("newBid", newBid);
    }
  }

  public broadcastNewBid(auction_id: string, newBid: any) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!", auction_id);
    } else {
      // const socket = this.findSocketForLot(lot_id);

      // if (socket) {
      //  console.log("websocket - attempting to emit to lot_id:", lot_id);
      //   socket.in(lot_id).emit("newBid", newBid);
      // }

      this.io.to(auction_id).emit("newBid", newBid);
    }
  }

  /**
   * Deprecated
   * @deprecated use broadcastLotStatusForAuction instead
   **/
  public broadcastLotStatus(lot_id: string, data: ILotStatus) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!", lot_id);
    } else {
      this.io.to(lot_id).emit("lotStatus", data);
    }
  }

  public broadcastLotStatusForAuction(auction_id: string, data: ILotStatus) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!", auction_id);
    } else {
      this.io.to(auction_id).emit("lotStatusForAuction", data);
    }
  }

  public broadcastLotExtended(lot_id: string, data: any) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!", lot_id);
    } else {
      this.io.to(lot_id).emit("lotExtended", data);
    }
  }

  public broadcastAuctionStatus(auction_id: string, data: IAuctionStatus) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!", auction_id);
    } else {
      console.log("broadcastAuctionStatus auction_id", auction_id);
      console.log("broadcastAuctionStatus auctionData", data);
      this.io.to(auction_id).emit("auctionStatus", data);
    }
  }

  public broadcastAuctionWentLive(client_entity_id: string, data: IAuctionWentLive) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!");
    } else {
      this.io.to(client_entity_id).emit("auctionWentLive", data);
    }
  }

  public broadcastAuctionManualStart(client_entity_id: string, data: IAuctionWentLive) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!");
    } else {
      this.io.to(client_entity_id).emit("auctionManualStart", data);
    }
  }

  public broadcastAuctionManualStop(client_entity_id: string, data: IAuctionWentLive) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!");
    } else {
      this.io.to(client_entity_id).emit("auctionManualStop", data);
    }
  }

  /**
   * Dont use this any more
   * @deprecated use broadcastVerifyBidder instead
   */
  public broadcastOpenFirstLot(lotData: any) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!");
    } else {
      this.io.emit("openedFirstLot", lotData);
    }
  }

  public broadcastCurrentLot(auction_id: string, data: any) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!");
    } else {
      this.io.to(auction_id).emit("currentLot", data);
    }
  }

  public broadcastRejectedBid(lot_entity_id: string, bidID: string) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!");
    } else {
      // this.io.to(lot_id).emit("rejectedBid", bidID); // TODO phase out
      this.io.to(lot_entity_id).emit("rejectBid", {
        lot_entity_id: lot_entity_id,
        bid_entity_id: bidID,
      });
    }
  }

  public broadcastBackedUpBids(lot_entity_id: string, bidIDs: string[]) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!");
    } else {
      // this.io.to(lot_id).emit("backedUpBids", bidIDs); // TODO phase out
      this.io.to(lot_entity_id).emit("backUpBids", {
        lot_entity_id: lot_entity_id,
        bid_entity_ids: bidIDs,
      });
    }
  }

  // deprecated
  public verifyBidder(user_id: string, data: { auction_id: string; is_verified: boolean }) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!");
    } else {
      this.io.to(user_id).emit("verifyBidder", data);
    }
  }

  public broadcastVerifyBidder(user_id: string, data: { client_entity_id: string; is_verified: boolean }) {
    if (this.io == null) {
      console.error("websocket - you must initialize first!");
    } else {
      this.io.to(user_id).emit("verifyBidder", data);
    }
  }
}
