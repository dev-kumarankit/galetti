import cron from "node-cron";

// Runs every minute
// cron.schedule("* * * * *", async () => {
//     const currentTime = moment().utc().startOf("minute").unix();
//     console.log("Running cron job at:", currentTime - 59 ,currentTime );
//     try {
//         const fromTime = currentTime - 180;
//         const toTime = currentTime;
//         // Fetch lots that ended within the time window
//         const lots = await LotRepository.search()
//         .where("date_to").between(fromTime, toTime)
//         .and("status").eq(LOT_BIDDING_OPEN)
//         .return.all();
//         // Combine into one array (placeholder for future merge logic)
//         const lotsEndingNow = [...lots];
//         console.log("lotsEndingNow--",lotsEndingNow.length)
//         for (const lot of lotsEndingNow) {
//             const auction = await AuctionRepository.fetch(lot.auction_entity_id);
//             // Skip if auction is not automated
//             if (!auction?.automated?.enabled) continue;
//             // Fetch highest open bid on the lot
//             const highestBid = await BidRepository.search()
//             .where("lot_entity_id").eq(lot[EntityId as any])
//             .sortBy("amount", "DESC")
//             .return.first();
//             let newStatus: any = null;
//             const hasReserve = !!parseFloat(lot.reserve_price?.toString() || "0");
//             const bidAmount = parseFloat(highestBid?.amount?.toString() || "0");
//             if (!hasReserve) { 
//                 // No reserve price
//                 if (highestBid) {
//                     newStatus = LOT_SOLD;
//                 } else {
//                     newStatus = LOT_STC; // You could also consider "UNSOLD"
//                 }
//             } else {
//                 // Has reserve price
//                 if (highestBid) {
//                     if (bidAmount >= parseFloat(lot.reserve_price.toString())) {
//                         newStatus = LOT_SOLD;
//                     } else {
//                         newStatus = LOT_STC;
//                     }
//                 } else {
//                     newStatus = LOT_STC;
//                 }
//             }
//             // Save new status
//             await LotRepository.save(lot[EntityId as any], {
//                 ...lot,
//                 status: newStatus,
//             });
//             // Broadcast update
//             rtc_di.broadcastLotStatusForAuction(lot.auction_entity_id, {
//                 lot_entity_id: lot[EntityId as any],
//                 lot_number: parseInt(lot.lot_number.toString()),
//                 auction_entity_id: lot.auction_entity_id.toString(),
//                 title: lot.title.toString(),
//                 status: newStatus,
//                 type: lot.type.toString(),
//                 highest_bid: highestBid,
//             });
//             console.log(`Updated lot ${lot.title} to status: ${newStatus}`);
//         }
        
//     } catch (err) {
//         console.error("Error in lot status updater cron job:", err);
//     }
// });



import { updateLotStatuses } from "./lot_status_updater";

cron.schedule("* * * * *", async () => {
    try {
        console.log("Running cron job to update lot statuses");
        await updateLotStatuses();
    } catch (err) {
        console.error("Error in lot status updater cron job:", err);
    }
});
