import cron from "node-cron";
import { runWaferPM } from "./wafer.job.js";
import { runBiscuitPM } from "./biscuit.job.js";
import { runUtilityPM } from "./utility.job.js";
import { runAstorPM } from "./astor.job.js";
import { sendEmailByJenisPM } from "../controllers/emailController.js";

cron.schedule(
    "0 1 * * 5", // ini jam 1 pagi di hari jumat => 5
  // "*/1 * * * *", ini buat testing permenit
  async () => {
    console.log("[CRON] PM WEEKLY START");

    try {
      const PM_JOBS = [
        { fn: runWaferPM, jenis: "wafer" },
        { fn: runBiscuitPM, jenis: "biscuit" },
        { fn: runUtilityPM, jenis: "utility" },
        { fn: runAstorPM, jenis: "astor" },
      ];

      for (const job of PM_JOBS) {
        const result = await job.fn();

        if (!result || !result.rows || result.rows.length === 0) {
          console.log(`[CRON] No new PM for ${job.jenis}`);
          continue;
        }
        const { rows, targetYear, targetWeek } = result;

        await sendEmailByJenisPM(job.jenis, rows, targetYear, targetWeek);
      }

      console.log("[CRON] PM WEEKLY DONE");
    } catch (err) {
      console.error("[CRON] ERROR:", err);
    }
  },
  { timezone: "Asia/Jakarta" }
);