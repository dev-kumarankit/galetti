import { createClient } from "redis";
import crypto from "crypto";
import { ulid } from "ulid";
// import Redis from "ioredis";

function getRedisUrl() {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  throw new Error("REDIS_URL is not defined");
}

function getULID() {
  return ulid();
}

// const redis = new Redis(getRedisUrl());
const redisClient = createClient({
  url: getRedisUrl(),
  password: process.env.REDIS_PASSWORD,
  database: 0,
});

redisClient.on("error", (err) => {
  console.log("=======>>>>>>> Redis Client Error <<<<<<<=======", err);
});

redisClient.on("connect", () => {
  console.log("=======>>>>>>> Redis Client Connected <<<<<<<=======");
});

redisClient.on("ready", () => {
  console.log("=======>>>>>>> Redis Client Ready <<<<<<<=======");
});

redisClient.on("reconnecting", () => {
  console.log("=======>>>>>>> Redis Client Reconnecting <<<<<<<=======");
});

redisClient.connect();

export { redisClient, getRedisUrl, getULID };

// const redisClient = createClient({
//   // url: "valkey://localhost:6389",
//   url: process.env.REDIS_URL,
// });

// export function initializeRedis() {
//   const redisClient = createClient({
//     // url: "valkey://localhost:6389",
//     url: process.env.REDIS_URL,
//   });

//   redisClient.on("error", (err) => {
//     console.log("REDIS error " + err);
//   });

//   redisClient.on("connect", () => {
//     console.log("REDIS connected");
//   });

//   redisClient.on("ready", () => {
//     console.log("REDIS ready");
//   });

//   redisClient.on("reconnecting", () => {
//     console.log("REDIS reconnecting");
//   });

//   redisClient.connect();

//   redisClient.set("key", "value");
//   // push sample lots to the list called "lots", lpush deos not exist on redisClient
// //   redisClient.hSet("lots", "1asd123asd123asd", { name: "lot1", price: 1000 });

//   return redisClient;
// }

// export { redisClient };
