import cron from "node-cron";
import { runWaferPM } from "./wafer.job.js";
import { runBiscuitPM } from "./biscuit.job.js";
import { runUtilityPM } from "./utility.job.js";
import { runAstorPM } from "./astor.job.js";
import { sendEmailByJenisPMRange } from "../controllers/emailController.js";
import { getEmailWeeksRange } from "../config/dateUtils.js";
import { automationDB } from "../src/db/automation.js";

cron.schedule(
    "0 1 * * 5", // ini jam 1 pagi di hari jumat => 5
  // "*/1 * * * *", 
  // ini buat testing permenit
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
      }

      // const now = new Date();
      // const isFriday = now.getDay() === 5; 

      // if (!isFriday) {
      //   console.log("[CRON] Skip email (not Friday)");
      //   console.log("[CRON] PM WEEKLY DONE");
      //   return;
      // }

      console.log("[CRON] FRIDAY EMAIL MODE");

      const weeks = getEmailWeeksRange(4); // 52,1,2,3
      const or = weeks.map(w => ({
        target_week: String(w.week),
        target_year: String(w.year),
      }));

      for (const jenis of ["wafer", "biscuit", "utility", "astor"]) {
        const rows = await automationDB.replacement_pm.findMany({
          where: {
            jenis_pm: jenis,
            OR: or,
          },
          orderBy: [
            { target_year: "asc" },
            { target_week: "asc" },
          ],
        });

        if (!rows.length) {
          console.log(`[CRON] No PM rows for email (${jenis})`);
          continue;
        }

        await sendEmailByJenisPMRange(jenis, rows, weeks);
      }

      console.log("[CRON] PM WEEKLY DONE");
    } catch (err) {
      console.error("[CRON] ERROR:", err);
    }
  },
  { timezone: "Asia/Jakarta" }
);