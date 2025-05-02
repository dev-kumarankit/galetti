import { test } from "./definitions/test";

export async function initializeJobs(agenda) {
  console.info("Initializing agenda jobs!");

  //TODO: add more jobs here.
  await test(agenda);
}
