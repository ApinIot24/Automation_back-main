import { Router } from "express";
import { testPmWeeklyCron } from "../controllers/pmWeeklyTestController.js";

const router = Router();

router.get("/test/pm_weekly", testPmWeeklyCron);

export default router;

