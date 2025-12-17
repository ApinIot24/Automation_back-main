import cron from "node-cron";
import { runWaferPM } from "./wafer.job.js";
import { runBiscuitPM } from "./biscuit.job.js";
import { runUtilityPM } from "./utility.job.js";
import { runAstorPM } from "./astor.job.js";

cron.schedule(
    "0 1 * * 5",
//   "*/1 * * * *",
  async () => {
    console.log("[CRON] PM WEEKLY START");

    try {
      await runWaferPM();
      await runBiscuitPM();
      await runUtilityPM();
      await runAstorPM();

      console.log("[CRON] PM WEEKLY DONE");
    } catch (err) {
      console.error("[CRON] ERROR:", err);
    }
  },
  { timezone: "Asia/Jakarta" }
);