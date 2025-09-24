import "reflect-metadata";
import { createServer } from "http";
import { expressApp } from "./express";
import { RealTimeCommunication } from "./helpers/real_time_communication";
import { Container } from "typedi";
import { CloudStorage } from "./integration/google/cloud_storage";
import { initializeFirebaseAdmin } from "./config/firebase";
import { initializeMongoDB } from "./integration/mongodb/mongodb";
import { determineFlavor } from "./helpers/utils/determine_flavor";
import "./services/v3/lotStatusCron";
import { generatePdf, sendEmailWithAttachment } from "./services/v3/generate_invoice";
determineFlavor();

console.info(`Starting API server!`);
const httpServer = createServer(expressApp);

const cloudStorageInstance = Container.get(CloudStorage);
cloudStorageInstance.getBucketMetadata();
cloudStorageInstance.configureBucketCors();

const rtc_di = Container.get(RealTimeCommunication);
rtc_di.initialize(httpServer);

initializeMongoDB();
initializeFirebaseAdmin();

async function main() {
  console.log("⛔ sending invoice mail....⚠️ ⚠️ ⚠️ ⛔ ⚠️ ⚠️. uncommnet this ⛔")
  //  sendEmailWithAttachment( );
}

main().catch(err => {
  console.error("❌ Error:",err);
});
const port = parseInt(process.env.PORT as string) || 7002;
const host = "0.0.0.0"; // localhost

httpServer
  .listen(port, host, null, () => {
    console.info(`Server is running at: http://${host}:${port}`);
  })
  .on("error", (err) => {
    console.error("🔥 SERVER ERROR:", err);
    process.exit(1);
  });
