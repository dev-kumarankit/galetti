import { initializeApp } from "firebase-admin/app";
import { credential } from "firebase-admin";

export function initializeFirebaseAdmin() {
  try {
    // const flavor = process.env.NODE_ENV; // LOCAL, DEV, UAT, PROD

    // switch (flavor) {
    //   case "LOCAL":
    //     console.log(`Firebase Admin initializing for LOCAL...`);
    //     break;
    //   case "DEV":
    //     console.log(`Firebase Admin initializing for DEV...`);
    //     break;
    //   case "UAT":
    //     console.log(`Firebase Admin initializing for UAT...`);
    //     break;
    //   case "PROD":
    //     console.log(`Firebase Admin initializing for PROD...`);
    //     break;
    //   default:
    //     console.log(`Firebase Admin initializing for DEV...`);
    //     break;
    // }

    initializeApp({
      credential: credential.cert("./service_account_key.json"),
      projectId: "creative-rides",
    });

    console.log(`Firebase Admin successfully initialized!`);
  } catch (error) {
    console.log(`Firebase Admin FAILED to initialize: ${error}`);
  }
}
