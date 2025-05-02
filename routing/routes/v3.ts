import { Router } from "express";

import { adminRouter } from "./v3/admin";
import { clientRouter } from "./v3/client";
import { userRouter } from "./v3/user";
import { auctionRouter } from "./v3/auction";
import { lotRouter } from "./v3/lot";
import { favoriteRouter } from "./v3/favorite"; // American spelling
import { bidRouter } from "./v3/bid";
import { bidderRouter } from "./v3/bidder";
import { fileRouter } from "./v3/file";
import { configurationRouter } from "./v3/configuration";
import { reportingRouter } from "./v3/reporting";
import { firebaseRouter } from "./v3/firebase";
import { newsletterRouter } from "./v3/newsletter";
import { smsRouter } from "./v3/sms";
import { archiveRouter } from "./v3/archive";
import { backupRouter } from "./v3/backup";
import { externalRouter } from "./v3/external";

const router = Router();

router.use("/admin", adminRouter);
router.use("/client", clientRouter);
router.use("/user", userRouter);
router.use("/auction", auctionRouter);
router.use("/lot", lotRouter);
router.use("/favorite", favoriteRouter);
router.use("/bid", bidRouter);
router.use("/bidder", bidderRouter);
router.use("/file", fileRouter);
router.use("/configuration", configurationRouter);
router.use("/reporting", reportingRouter);
router.use("/firebase", firebaseRouter);
router.use("/newsletter", newsletterRouter);
router.use("/sms", smsRouter);
router.use("/archive", archiveRouter);
router.use("/backup", backupRouter);
router.use("/external", externalRouter);

export { router as v3Router };
