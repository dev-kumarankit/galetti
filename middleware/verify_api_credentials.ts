import jwt from "jsonwebtoken";
import { ApiCredentialRepository } from "../schemas/redis/api_credentials";

export async function verifyApiCredentials(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).send("Authorization header missing");

    const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
    if (!token) return res.status(401).send("Bearer token missing");

    const existingCredentials = await ApiCredentialRepository.search().where("access_token").eq(token).return.first();
    if (!existingCredentials) return res.status(403).send("Invalid or revoked token");

    jwt.verify(token, existingCredentials.api_secret.toString(), (err, decodedToken) => {
      if (err) return res.status(403).send("Token verification failed");
      req.decoded_api_credentials = decodedToken;
      next();
    });
  } catch (error) {
    console.error("Error verifying API credentials:", error);
    return res.status(500).send("Internal server error");
  }
}
