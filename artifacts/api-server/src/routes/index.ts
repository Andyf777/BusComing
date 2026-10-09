import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ctbProxyRouter from "./ctb-proxy";
import kmbProxyRouter from "./kmb-proxy";
import gmbProxyRouter from "./gmb-proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ctbProxyRouter);
router.use(kmbProxyRouter);
router.use(gmbProxyRouter);

export default router;
