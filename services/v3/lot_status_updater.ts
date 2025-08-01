import moment from "moment-timezone";
import { LotRepository } from "../../schemas/redis/lot";
import { BidRepository } from "../../schemas/redis/bid";
import { AuctionRepository } from "../../schemas/redis/auction";
import { LOT_BIDDING_OPEN, LOT_SOLD, LOT_STC } from "../../helpers/constants/lot_enums";
import { EntityId } from "redis-om";
import { Container } from "typedi";
import { RealTimeCommunication } from "../../helpers/real_time_communication";


export async function updateLotStatuses(lotId?: any) {
    const rtc_di = Container.get(RealTimeCommunication);
    let lots: any[] = [];
    
    if (lotId) {
        // Fetch specific lot
        const lot = await LotRepository.fetch(lotId);
        if (!lot || lot.status !== LOT_BIDDING_OPEN) {
            console.log(`Lot with ID ${lotId} not found or not open for bidding.`);
            return;
        }
        lots = [lot];
    } else {
        // Default cron behavior: fetch lots in the time window
        const currentTime = moment().utc().startOf("minute").unix();
        const fromTime = currentTime - 180;
        const toTime = currentTime;
        
        lots = await LotRepository.search()
        .where("date_to").between(fromTime, toTime)
        .and("status").eq(LOT_BIDDING_OPEN)
        .return.all();
    }
    
    console.log("Lots to update:", lots.length);
    
    for (const lot of lots) {
        const auction = await AuctionRepository.fetch(lot.auction_entity_id);
        if (!auction?.automated?.enabled) continue;
        
        const highestBid = await BidRepository.search()
        .where("lot_entity_id").eq(lot[EntityId as any])
        .sortBy("amount", "DESC")
        .return.first();
        
        const hasReserve = !!parseFloat(lot.reserve_price?.toString() || "0");
        const bidAmount = parseFloat(highestBid?.amount?.toString() || "0");
        
        let newStatus: any = null;
        
        if (!hasReserve) {
            newStatus = highestBid ? LOT_SOLD : LOT_STC;
        } else {
            newStatus = (highestBid && bidAmount >= parseFloat(lot.reserve_price.toString()))
            ? LOT_SOLD
            : LOT_STC;
        }
        
        await LotRepository.save(lot[EntityId as any], {
            ...lot,
            status: newStatus,
        });
        let return_data= {
            lot_entity_id: lot[EntityId as any],
            lot_number: parseInt(lot.lot_number.toString()),
            auction_entity_id: lot.auction_entity_id.toString(),
            title: lot.title.toString(),
            status: newStatus,
            type: lot.type.toString(),
            highest_bid: highestBid,
        }
        rtc_di.broadcastLotStatusForAuction(lot.auction_entity_id, return_data);
        
        console.log(`Updated lot ${lot.title} to status: ${newStatus}`);
        return return_data
    }
}
