import cron from "node-cron";

import { updateLotStatuses } from "./lot_status_updater";
import { triggerAutoBidCron } from "./triggerAutoBidCron";
// cron.schedule("* * * * *", async () => {
cron.schedule("*/5 * * * * *", async () => { 
    try {

        // console.log("Running cron job to update lot statuses");
        // await updateLotStatuses();
        // await triggerAutoBidCron();

        
    } catch (err) {
        console.error("Error in lot status updater cron job:", err);
    }
});


cron.schedule("*/10 * * * * *", async () => { 
    try {

        // console.log("Running cron job to trigger Auto Bid");
        // await triggerAutoBidCron();

        
    } catch (err) {
        console.error("Error in trigger Auto Bidd:", err);
    }
});

