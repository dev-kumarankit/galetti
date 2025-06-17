import { AUCTION_TYPES } from "./auction_enums";

const LOT_WITHDRAWN = "Withdrawn";
const LOT_SOLD = "Sold";
const LOT_PASSED = "Passed";
const LOT_BIDDING_OPEN = "Bidding Open";
const LOT_BIDDING_CLOSED = "Bidding Closed";
const LOT_STC = "Subject to Confirm";
const LOT_RNR="Reserve Not reached";


const LOT_STATUSES = [LOT_WITHDRAWN, LOT_SOLD, LOT_PASSED, LOT_BIDDING_OPEN, LOT_BIDDING_CLOSED,LOT_STC,LOT_RNR];

const LOT_TYPES = AUCTION_TYPES;

export { LOT_WITHDRAWN, LOT_SOLD, LOT_PASSED, LOT_BIDDING_OPEN, LOT_BIDDING_CLOSED, LOT_STATUSES, LOT_TYPES,LOT_STC,LOT_RNR };
