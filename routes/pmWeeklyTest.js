import { Router } from "express";
import { testReplacementPatterns, triggerPmWeeklyCron } from "../controllers/pmWeeklyTestController.js";

const router = Router();

router.get("/test/replacement_patterns", testReplacementPatterns);
router.post("/test/trigger_cron", triggerPmWeeklyCron);

export default router;

