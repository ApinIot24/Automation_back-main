import { runWaferPM } from "../jobs/wafer.job.js";
import { runBiscuitPM } from "../jobs/biscuit.job.js";
import { runUtilityPM } from "../jobs/utility.job.js";
import { runAstorPM } from "../jobs/astor.job.js";
import { runChokiPM } from "../jobs/choki.js";
import { sendEmailByJenisPMRange } from "./emailController.js";
import { getEmailWeeksRange, getLastWeekRolling4, hasReplacementInPeriode, isReplacementAtTargetWeek, getTotalWeeksInYear } from "../config/dateUtils.js";
import { automationDB } from "../src/db/automation.js";

// Helper function to get rolling weeks from a specific week/year
function getRollingWeeksFrom(week, year, count = 5) {
  const weeks = [];
  let w = week;
  let y = year;

  for (let i = 0; i < count; i++) {
    const max = getTotalWeeksInYear(y);
    if (w > max) {
      w = 1;
      y++;
    }
    weeks.push({ week: w, year: y });
    w++;
  }

  return weeks;
}

export async function testPmWeeklyCron(req, res) {
  try {
    console.log("[TEST] PM WEEKLY START");

    // Get query parameters for custom week/year
    const customYear = req.query.target_year ? parseInt(req.query.target_year, 10) : null;
    const customWeek = req.query.target_week ? parseInt(req.query.target_week, 10) : null;

    const results = {
      jobs: [],
      emails: [],
      errors: [],
      debug: {
        targetWeek: null,
        targetYear: null,
        emailWeeks: [],
        pmDataCounts: {},
        replacementDataCounts: {},
        customParams: {
          used: false,
          year: customYear,
          week: customWeek,
        },
      },
    };

    // Get target week for jobs
    let rolling, targetWeek, targetYear;
    
    if (customYear && customWeek) {
      // Use custom week/year
      results.debug.customParams.used = true;
      rolling = getRollingWeeksFrom(customWeek, customYear, 5);
      targetWeek = customWeek;
      targetYear = customYear;
    } else {
      // Use default (current week + 5)
      rolling = getLastWeekRolling4(5);
      const last = rolling[rolling.length - 1];
      targetWeek = last.week;
      targetYear = last.year;
    }

    results.debug.targetWeek = targetWeek;
    results.debug.targetYear = targetYear;
    results.debug.rollingWeeks = rolling;

    // Check PM data counts and replacement eligibility
    const pmTables = {
      wafer: "pm_wafer",
      biscuit: "pm_biscuit",
      utility: "pm_utility",
      astor: "pm_astor",
      choki: "pm_choki",
    };

    for (const [jenis, tableName] of Object.entries(pmTables)) {
      const totalCount = await automationDB[tableName].count();
      
      // Check how many have replacement periode
      const allRows = await automationDB[tableName].findMany({
        select: { periode: true, periode_start: true },
      });
      
      const withReplacement = allRows.filter(r => hasReplacementInPeriode(r.periode));
      const eligibleForTargetWeek = withReplacement.filter(r => 
        isReplacementAtTargetWeek(r.periode, r.periode_start, targetWeek, targetYear)
      );

      results.debug.pmDataCounts[jenis] = {
        total: totalCount,
        withReplacement: withReplacement.length,
        eligibleForTargetWeek: eligibleForTargetWeek.length,
      };
    }

    // Check existing replacement_pm data
    // Use custom week/year for email weeks if provided, otherwise use default
    let weeks;
    if (customYear && customWeek) {
      // Calculate 4 weeks starting from custom week
      weeks = [];
      let w = customWeek;
      let y = customYear;
      for (let i = 0; i < 4; i++) {
        const max = getTotalWeeksInYear(y);
        if (w > max) {
          w = 1;
          y++;
        }
        weeks.push({ week: w, year: y });
        w++;
      }
    } else {
      weeks = getEmailWeeksRange(4);
    }
    results.debug.emailWeeks = weeks;
    const or = weeks.map((w) => ({
      target_week: String(w.week),
      target_year: String(w.year),
    }));

    for (const jenis of ["wafer", "biscuit", "utility", "astor", "choki"]) {
      const count = await automationDB.replacement_pm.count({
        where: {
          jenis_pm: jenis,
          OR: or,
        },
      });
      results.debug.replacementDataCounts[jenis] = count;
    }

    // Run PM Jobs with custom week/year if provided
    const PM_JOBS = [
      { fn: runWaferPM, jenis: "wafer", table: "pm_wafer" },
      { fn: runBiscuitPM, jenis: "biscuit", table: "pm_biscuit" },
      { fn: runUtilityPM, jenis: "utility", table: "pm_utility" },
      { fn: runAstorPM, jenis: "astor", table: "pm_astor" },
      { fn: runChokiPM, jenis: "choki", table: "pm_choki" },
    ];

    for (const job of PM_JOBS) {
      try {
        let result;
        
        if (customYear && customWeek) {
          // Test with custom week/year - manually check and create
          const rows = await automationDB[job.table].findMany();
          const createdRows = [];
          
          for (const row of rows) {
            if (!hasReplacementInPeriode(row.periode)) {
              continue;
            }
            if (!isReplacementAtTargetWeek(row.periode, row.periode_start, customWeek, customYear)) {
              continue;
            }

            // Check if already exists
            const exists = await automationDB.replacement_pm.findFirst({
              where: {
                jenis_pm: job.jenis,
                target_week: String(customWeek),
                target_year: String(customYear),
                machine_name: row.machine_name,
                grup: row.grup,
              },
            });

            if (exists) {
              continue; // Skip if already exists
            }

            const { id, status, ...clean } = row;

            const created = await automationDB.replacement_pm.create({
              data: {
                ...clean,
                jenis_pm: job.jenis,
                status: 0,
                target_week: String(customWeek),
                target_year: String(customYear),
              },
            });

            createdRows.push(created);
          }

          result = {
            rows: createdRows,
            targetWeek: customWeek,
            targetYear: customYear,
          };
        } else {
          // Use default job functions
          result = await job.fn();
        }

        if (!result || !result.rows || result.rows.length === 0) {
          results.jobs.push({
            jenis: job.jenis,
            status: "no_data",
            message: `No new PM for ${job.jenis}`,
          });
          console.log(`[TEST] No new PM for ${job.jenis}`);
        } else {
          results.jobs.push({
            jenis: job.jenis,
            status: "success",
            message: `Created ${result.rows.length} new PM records`,
            count: result.rows.length,
          });
        }
      } catch (err) {
        results.jobs.push({
          jenis: job.jenis,
          status: "error",
          message: err.message,
        });
        results.errors.push({
          type: "job",
          jenis: job.jenis,
          error: err.message,
        });
        console.error(`[TEST] Error in ${job.jenis}:`, err);
      }
    }

    // Get email weeks range (already set above)
    // const weeks = getEmailWeeksRange(4); // 52,1,2,3
    // const or = weeks.map((w) => ({
    //   target_week: String(w.week),
    //   target_year: String(w.year),
    // }));

    // Send emails for each jenis
    for (const jenis of ["wafer", "biscuit", "utility", "astor", "choki"]) {
      try {
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
          results.emails.push({
            jenis: jenis,
            status: "no_data",
            message: `No PM rows for email (${jenis})`,
          });
          console.log(`[TEST] No PM rows for email (${jenis})`);
          continue;
        }

        await sendEmailByJenisPMRange(jenis, rows, weeks);
        results.emails.push({
          jenis: jenis,
          status: "success",
          message: `Email sent for ${jenis}`,
          count: rows.length,
        });
      } catch (err) {
        results.emails.push({
          jenis: jenis,
          status: "error",
          message: err.message,
        });
        results.errors.push({
          type: "email",
          jenis: jenis,
          error: err.message,
        });
        console.error(`[TEST] Error sending email for ${jenis}:`, err);
      }
    }

    console.log("[TEST] PM WEEKLY DONE");

    res.status(200).json({
      success: true,
      message: "PM Weekly cron test completed",
      results: results,
      weeks: weeks,
    });
  } catch (err) {
    console.error("[TEST] ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Failed to run PM Weekly cron test",
      details: err.message,
    });
  }
}

