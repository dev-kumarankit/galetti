import crypto from "crypto";

const generateApiKey = () => {
  return crypto.randomBytes(16).toString("hex");
};

const generateApiSecret = () => {
  return crypto.randomBytes(32).toString("hex");
};

export { generateApiKey, generateApiSecret };
