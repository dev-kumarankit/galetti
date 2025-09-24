import Bull from "bull";
import { getRedisUrl } from "../../redis";
import Container from "typedi";
import { RealTimeCommunication } from "../../../../helpers/real_time_communication";
import moment from "moment";
import { LotRepository } from "../../../../schemas/redis/lot";
import { updateLotStatuses } from "../../../../services/v3/lot_status_updater";
import { triggerAutoBidCron } from "../../../../services/v3/triggerAutoBidCron";
import { EntityId } from "redis-om";

export const lot_start = new Bull(`Lot_start`, getRedisUrl(), {
    redis: {
        keyPrefix: "BULL",
        password: process.env.REDIS_PASSWORD,
    },
});
export const lot_end = new Bull(`Lot_end`, getRedisUrl(), {
    redis: {
        keyPrefix: "BULL",
        password: process.env.REDIS_PASSWORD,
    },
});

export const lot_update_end = new Bull(`Lot_Update_End`, getRedisUrl(),{
    redis:{
        keyPrefix:"BULL",
        password:  process.env.REDIS_PASSWORD,
    }
})

export const lot_countdown = new Bull(`Lot_Countdown`, getRedisUrl(), {
    redis: {
        keyPrefix: "BULL",
        password: process.env.REDIS_PASSWORD,
    },
});
lot_start.process(async (job) => {
    console.log("Scheduling a lot start .......")
    const { data } = job;
    const { lot_entity_id } = data;
    const rtc_di = Container.get(RealTimeCommunication);
    
    LotRepository.fetch(lot_entity_id).then(async (lot) => {
        if (lot) {
            console.log("Lot started", lot_entity_id);
            job.finished().then(() => {
                console.log("Lot start job has finished, cleaning up.");
                job.remove(); // clean up redis
            });
            let return_data = {
                lot_entity_id: lot[EntityId as any],
                lot_number: parseInt(lot?.lot_number?.toString()),
                auction_entity_id: lot?.auction_entity_id?.toString(),
                title: lot.title.toString(),
                status:  "start",
                type: lot.type.toString(),
            };
            rtc_di.broadcastLotStatusForAuction(lot.auction_entity_id, return_data);
            await triggerAutoBidCron();
            const now = moment();
            const lot_end_time = moment(lot.date_to.toString());
            const diff = lot_end_time.diff(now, "milliseconds");
            lot_end.add(
                {
                    lot_entity_id: lot_entity_id,
                },
                {
                    delay: diff,
                },
            );
        } else {
            console.log("Failed to find lot to process START job");
        }
    });
});




lot_end.process(async (job) => {
    const { data } = job;
    const { lot_entity_id } = data;
    console.log("Scheduling a lot end .......",lot_entity_id)
    await updateLotStatuses(lot_entity_id);
    job.finished().then(() => {
        console.log("lot end job has finished, cleaning up.");
        job.remove(); // clean up redis
    });
})

lot_countdown.process(async (job) => {
  const { lot_entity_id } = job.data;
  const rtc_di = Container.get(RealTimeCommunication);

  const lot = await LotRepository.fetch(lot_entity_id);
  if (lot) {
    rtc_di.emitLotCountdown(lot_entity_id,{
      lot_entity_id,
      lot_number: parseInt(lot.lot_number.toString()),
      auction_entity_id: lot.auction_entity_id.toString(),
      seconds_remaining: 120, // always 2 min at this point
    });
  }

  await job.finished();
  job.remove();
});