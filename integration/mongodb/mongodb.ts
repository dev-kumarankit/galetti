import mongoose from "mongoose";
import { initializeAgenda } from "./agenda/agenda";

if (process.env.NODE_ENV == "DEV" || process.env.NODE_ENV == "LOCAL") {
  mongoose.set("debug", true);
  console.info("=======>>>>>>> MongoDB debug mode = true <<<<<<<=======");
}

export function initializeMongoDB() {
  const url = process.env.MONGO_DB_URL;

  try {
    mongoose
      .connect(url, {
        ssl: false, //
      })
      .then((value) => {
        console.info("=======>>>>>>> Mongoose Connected to MongoDB <<<<<<<=======");

        value.connection.on("error", (err) => {
          console.error(`🔥 MongoDB connection error: ${err}`);
          // process.exit(-1);
        });

        initializeAgenda(value.connection.db);
      });
  } catch (e) {
    console.error("🔥 MongoDB error:", e);
  }

  return mongoose.connection;
}
