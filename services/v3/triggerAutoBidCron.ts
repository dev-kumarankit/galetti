import moment from "moment-timezone";
import { LotRepository } from "../../schemas/redis/lot";
import { LOT_BIDDING_OPEN } from "../../helpers/constants/lot_enums";
import { EntityId } from "redis-om";

import { triggerAutoBidForLot } from "./triggerAutoBidForLot";

export async function triggerAutoBidCron() {
  // Find all lots that match criteria
const oneMinuteAgo = Math.floor(Date.now() / 1000) - 600; // current time - 1 minute in seconds
const now = Math.floor(Date.now() / 1000);
const eligibleLots = await LotRepository.search()
  .where("isAutoBidEnable").eq(true)
  .and("status").eq(LOT_BIDDING_OPEN)
  .and("date_from").between(oneMinuteAgo, now)
  .return.all();

  if (eligibleLots.length === 0) return;
  for (const lot of eligibleLots) {
    console.log("triggerAutoBidCron EntityId--",lot[EntityId])
    await triggerAutoBidForLot(lot[EntityId]);
  }
}
