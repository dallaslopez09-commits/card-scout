import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import { cardsRouter } from "./cards";
import { collectionRouter } from "./collection";
import { wishlistRouter } from "./wishlist";
import { portfolioRouter } from "./portfolio";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(cardsRouter);
router.use(collectionRouter);
router.use(wishlistRouter);
router.use(portfolioRouter);

export default router;
