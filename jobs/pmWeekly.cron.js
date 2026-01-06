import cron from "node-cron";
import { sendEmailByJenisPMRange } from "../controllers/emailController.js";
import { getEmailWeeksRange, getLastWeekRolling4, hasReplacementInPeriode, getTotalWeeksInYear } from "../config/dateUtils.js";
import { automationDB } from "../src/db/automation.js";

// Helper function to calculate replacement pattern weeks
function calculateReplacementPattern(periode, periode_start, targetYear) {
  if (!periode || !periode_start) return [];
  
  const rToken = periode
    .split(",")
    .map(p => p.trim())
    .find(p => /^\/?R\d+W$/i.test(p));
  
  if (!rToken) return [];
  
  const intervalMatch = rToken.match(/\d+/);
  const interval = intervalMatch ? parseInt(intervalMatch[0], 10) : NaN;
  if (!interval || isNaN(interval) || interval <= 0) return [];
  
  const starts = periode_start
    .split(",")
    .map(s => {
      const [y, w] = s.trim().split("w");
      return { year: parseInt(y, 10), week: parseInt(w, 10) };
    })
    .filter(s => !isNaN(s.year) && !isNaN(s.week) && s.week > 0);
  
  if (starts.length === 0) return [];
  
  // Find all replacement weeks in target year
  const pattern = [];
  const totalWeeks = getTotalWeeksInYear(targetYear);
  
  for (const start of starts) {
    let y = start.year;
    let w = start.week;
    
    // Calculate until we reach target year
    while (y < targetYear) {
      w += interval;
      const max = getTotalWeeksInYear(y);
      while (w > max) {
        w -= max;
        y++;
      }
    }
    
    // Now calculate weeks in target year
    if (y === targetYear) {
      while (w <= totalWeeks) {
        pattern.push({ week: w, year: y });
        w += interval;
      }
    } else if (y > targetYear) {
      // Start from beginning of target year
      let firstWeek = 1;
      // Calculate offset from start
      let weeksPassed = 0;
      let tempY = start.year;
      let tempW = start.week;
      
      while (tempY < targetYear) {
        const max = getTotalWeeksInYear(tempY);
        weeksPassed += (max - tempW + 1);
        tempY++;
        tempW = 1;
      }
      
      const remainder = weeksPassed % interval;
      if (remainder === 0) {
        firstWeek = 1;
      } else {
        firstWeek = interval - remainder + 1;
      }
      
      w = firstWeek;
      while (w <= totalWeeks) {
        pattern.push({ week: w, year: targetYear });
        w += interval;
      }
    }
  }
  
  // Remove duplicates and sort
  const unique = Array.from(new Set(pattern.map(p => `${p.year}w${p.week}`)))
    .map(s => {
      const [y, w] = s.split("w");
      return { year: parseInt(y), week: parseInt(w) };
    })
    .sort((a, b) => a.week - b.week);
  
  return unique;
}

cron.schedule(
  "0 1 * * 5", // Jam 1 pagi di hari Jumat
  // "*/1 * * * *", // Uncomment untuk testing per menit
  async () => {
    console.log("[CRON] PM WEEKLY START");

    try {
      const pmTables = {
        wafer: "pm_wafer",
        biscuit: "pm_biscuit",
        utility: "pm_utility",
        astor: "pm_astor",
        choki: "pm_choki",
      };

      // Step 0: Tentukan window minggu untuk email & generate
      const emailWeeks = getEmailWeeksRange(4);
      if (!emailWeeks || emailWeeks.length === 0) {
        console.error("[CRON] No weeks range returned from getEmailWeeksRange");
        return;
      }

      // Gunakan rolling window yang lebih besar (8 minggu) untuk generate
      const rolling8 = getLastWeekRolling4(8);
      
      // windowWeeks = 8 minggu ke depan untuk generate data
      const windowWeeks = [];
      const seen = new Set();
      for (const w of rolling8) {
        const key = `${w.year}w${w.week}`;
        if (!seen.has(key)) {
          seen.add(key);
          windowWeeks.push(w);
        }
      }

      console.log("[CRON] Window weeks for processing:", windowWeeks.map(w => `${w.year}w${w.week}`).join(", "));
      console.log("[CRON] Email weeks:", emailWeeks.map(w => `${w.year}w${w.week}`).join(", "));

      // Step 1: Generate replacement_pm untuk setiap jenis dan setiap minggu di window
      for (const [jenis, pmTable] of Object.entries(pmTables)) {
        try {
          const pmRows = await automationDB[pmTable].findMany();
          let withReplacement = 0;
          let eligibleMatches = 0;
          let inserted = 0;
          let duplicates = 0;

          for (const row of pmRows) {
            if (!hasReplacementInPeriode(row.periode)) continue;
            withReplacement++;

            // Loop untuk SEMUA minggu di windowWeeks
            for (const w of windowWeeks) {
              const targetWeek = w.week;
              const targetYear = w.year;

              // PERBAIKAN: Gunakan calculateReplacementPattern yang lebih akurat
              const pattern = calculateReplacementPattern(row.periode, row.periode_start, targetYear);
              const isEligible = pattern.some(p => p.week === targetWeek && p.year === targetYear);
              
              if (!isEligible) {
                continue;
              }

              eligibleMatches++;

              // Cek apakah sudah ada di database (validasi duplikasi)
              const exists = await automationDB.replacement_pm.findFirst({
                where: {
                  jenis_pm: jenis,
                  target_week: String(targetWeek),
                  target_year: String(targetYear),
                  machine_name: row.machine_name,
                  grup: row.grup,
                },
              });

              if (exists) {
                duplicates++;
                continue;
              }

              // Insert ke database
              const { id, status, ...clean } = row;
              await automationDB.replacement_pm.create({
                data: {
                  ...clean,
                  jenis_pm: jenis,
                  status: 0,
                  target_week: String(targetWeek),
                  target_year: String(targetYear),
                },
              });
              inserted++;
              console.log(`[CRON] ✓ Inserted: ${jenis} - ${row.machine_name} (grup ${row.grup}) - Week ${targetYear}w${targetWeek}`);
            }
          }

          if (inserted > 0) {
            console.log(`[CRON] Successfully processed ${jenis}: ${inserted} new records created`);
          } else {
            console.log(`[CRON] No new PM for ${jenis} (duplicates: ${duplicates}, eligible: ${eligibleMatches})`);
          }

        } catch (err) {
          console.error(`[CRON] Error processing ${jenis}:`, err);
          // Continue with next jenis even if one fails
        }
      }

      // Step 2: Send Emails (menggunakan email window 4 minggu)
      console.log("[CRON] FRIDAY EMAIL MODE");

      // Kirim email per channel (bukan per jenis)
      // Channel "wafer" akan include: wafer, astor, choki
      // Channel "biscuit" akan include: biscuit
      // Channel "utility" akan include: utility
      const channelsSent = new Set();
      
      for (const jenis of ["wafer", "biscuit", "utility", "astor", "choki"]) {
        try {
          const channel = PM_EMAIL_CHANNEL[jenis] ?? jenis;
          
          // Skip jika channel sudah dikirim
          if (channelsSent.has(channel)) {
            console.log(`[CRON] Skip ${jenis} (channel ${channel} already sent)`);
            continue;
          }

          // Kirim email untuk channel ini (akan fetch semua jenis PM dalam channel)
          await sendEmailByJenisPMRange(jenis, [], emailWeeks);
          channelsSent.add(channel);
          
          console.log(`[CRON] ✓ Successfully sent email for channel ${channel}`);
        } catch (err) {
          console.error(`[CRON] Error sending email for ${jenis}:`, err);
          // Continue with next jenis even if one fails
        }
      }

      console.log("[CRON] PM WEEKLY DONE");
    } catch (err) {
      console.error("[CRON] ERROR:", err);
      console.error("[CRON] ERROR Stack:", err.stack);
      // Don't let the error crash the entire application
      // The cron will continue to run on the next schedule
    }
  },
  { timezone: "Asia/Jakarta" }
);