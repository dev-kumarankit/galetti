import { PAYMENT_STATUSES_CODE } from './payment_statuses';

export async function getStatus(code: string) {
  for (const status of PAYMENT_STATUSES_CODE) {
    let loopIndex = 0;
    let statusDescription;
    for (const statusArray of Object.values(status)) {
      let foundIndex = statusArray.findIndex((x) => {
        if (code === x.code) {
          statusDescription = x.description;
          return true;
        }
        return false;
      });

      if (foundIndex > -1) {
        const statusName = Object.keys(status)[loopIndex];
        return {
          status_name: statusName,
          status_description: statusDescription,
        };
      }

      loopIndex++;
    }
  }
}
