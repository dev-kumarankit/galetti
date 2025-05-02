import dotenv from "dotenv";

export function determineFlavor() {
  //Determine which flavor to boot up.
  const flavorIdx = process.argv.findIndex((x) => x.includes("--flavor"));
  const flavor = process.argv[flavorIdx].split("=")[1];

  let envPath = "";
  switch (flavor) {
    case "local":
      envPath = "./envs/local.env";
      break;
    case "development":
      envPath = "./envs/dev.env";
      break;
    case "uat":
      envPath = "./envs/uat.env";
      break;
    case "production":
      envPath = "./envs/prod.env";
      break;
    case "fred":
      envPath = "./envs/fred.env";
      break;
    case "kagiso":
      envPath = "./envs/kagiso.env";
      break;
  }

  const envFound = dotenv.config({
    path: envPath,
  });

  if (envFound.error) {
    throw new Error("Couldn't find the .env file!");
  }

  console.log(`FLAVOR: ${flavor}`);
}
