import { Types } from "mongoose";
import BidderModel from "../types/models/collections/bidder";

/**
 * Generates a new paddle number for a bidder for a specific auction.
 * @param auction_id
 * @returns A new available paddle number.
 */
export async function generateNewPaddleNumber(auction_id: string): Promise<string> {
  const maxBidders = 999;

  const paddleNumberRecords = await BidderModel.aggregate([
    {
      $match: {
        auction_id: new Types.ObjectId(auction_id),
      },
    },
    {
      $project: {
        paddle_number: 1,
      },
    },
  ]);

  if (paddleNumberRecords.length > maxBidders) {
    throw new Error(`Maximum number of bidders reached for this auction.`);
  }

  const existingPaddleNumberArray = paddleNumberRecords.map((item) => item.paddle_number);

  // The paddle number must be unique.
  let randomNumber = (Math.floor(Math.random() * maxBidders) + 1).toString(); // Generate random number between 1 - maxBidders

  while (existingPaddleNumberArray.includes(randomNumber)) {
    randomNumber = (Math.floor(Math.random() * maxBidders) + 1).toString();
  }

  // Pad number with leading zeroes
  const padLength = maxBidders.toString().length;
  const newPaddleNumber = randomNumber.toString().padStart(padLength, "0");
  console.log("generateNewPaddleNumber() response:", newPaddleNumber);

  return newPaddleNumber;
}
