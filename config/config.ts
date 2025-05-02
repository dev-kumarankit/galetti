import { determineFlavor } from "../helpers/utils/determine_flavor";

determineFlavor();

export default {
  port: parseInt(process.env.PORT),
  databaseURL: process.env.MONGODB_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtAlgorithm: process.env.JWT_ALGORITHM,
  logs: {
    level: process.env.LOG_LEVEL || "silly",
  },
  //
  googleStorageUrl: process.env.GOOGLE_STORAGE_URL,
  googleProjectId: process.env.GOOGLE_PROJECT_ID,
  googleBucketName: process.env.GOOGLE_BUCKET_NAME,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  //
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioAccountSID: process.env.TWILIO_ACCOUNT_SID,
  //
  millicastAccountId: process.env.MILLICAST_ACCOUNT_ID,
  defaultClientAdminPassword: process.env.DEFAULT_CLIENT_ADMIN_PASSWORD,
  // It's not necessary ano more to have all the environment variables
  // in this config file.
  // Use the process.env.ABC directly in the code.
};
