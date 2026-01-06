import { sendEmailByJenisPMRange } from "./emailController.js";
import { getEmailWeeksRange, getLastWeekRolling4, hasReplacementInPeriode, isReplacementAtTargetWeek, getTotalWeeksInYear } from "../config/dateUtils.js";
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

// FUNGSI BARU: Test specific periode calculation
export async function testSpecificPeriode(req, res) {
  try {
    const { periode, periode_start, target_week, target_year } = req.query;
    
    if (!periode || !periode_start) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: periode, periode_start"
      });
    }
    
    const targetWeek = target_week ? parseInt(target_week) : 6;
    const targetYear = target_year ? parseInt(target_year) : 2026;
    
    // Test dengan isReplacementAtTargetWeek
    const isEligible = isReplacementAtTargetWeek(periode, periode_start, targetWeek, targetYear);
    
    // Test dengan calculateReplacementPattern
    const pattern = calculateReplacementPattern(periode, periode_start, targetYear);
    const isInPattern = pattern.some(p => p.week === targetWeek && p.year === targetYear);
    
    // Manual calculation untuk debugging
    const rToken = periode.split(",").map(p => p.trim()).find(p => /^\/?R\d+W$/i.test(p));
    const intervalMatch = rToken ? rToken.match(/\d+/) : null;
    const interval = intervalMatch ? parseInt(intervalMatch[0], 10) : null;
    
    const starts = periode_start.split(",").map(s => {
      const [y, w] = s.trim().split("w");
      return { year: parseInt(y, 10), week: parseInt(w, 10) };
    });
    
    // Calculate step by step
    const calculations = [];
    if (interval && starts.length > 0) {
      for (const start of starts) {
        let y = start.year;
        let w = start.week;
        const steps = [`Start: ${y}w${w}`];
        
        let iteration = 0;
        while (y <= targetYear && iteration < 100) {
          w += interval;
          const max = getTotalWeeksInYear(y);
          
          if (w > max) {
            steps.push(`${y}w${w} -> overflow (max: ${max})`);
            w -= max;
            y++;
            steps.push(`Carry to: ${y}w${w}`);
          } else {
            steps.push(`Next: ${y}w${w}`);
          }
          
          if (y === targetYear && w === targetWeek) {
            steps.push(`✓ MATCH at ${y}w${w}!`);
            break;
          }
          
          if (y > targetYear || (y === targetYear && w > targetWeek)) {
            steps.push(`Passed target ${targetYear}w${targetWeek}`);
            break;
          }
          
          iteration++;
        }
        
        calculations.push({
          start: `${start.year}w${start.week}`,
          steps: steps,
        });
      }
    }
    
    res.status(200).json({
      success: true,
      input: {
        periode,
        periode_start,
        target: `${targetYear}w${targetWeek}`,
      },
      results: {
        isReplacementAtTargetWeek: isEligible,
        isInCalculatedPattern: isInPattern,
        match: isEligible && isInPattern,
      },
      debug: {
        rToken,
        interval,
        starts,
        allPatternWeeks: pattern.map(p => `${p.year}w${p.week}`),
        manualCalculations: calculations,
      },
    });
  } catch (err) {
    console.error("[TEST] Error in testSpecificPeriode:", err);
    res.status(500).json({
      success: false,
      error: "Failed to test periode",
      details: err.message,
    });
  }
}

// New function to test and show all replacement patterns
export async function testReplacementPatterns(req, res) {
  try {
    const { jenis, grup, year } = req.query;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    
    const pmTables = {
      wafer: "pm_wafer",
      biscuit: "pm_biscuit",
      utility: "pm_utility",
      astor: "pm_astor",
      choki: "pm_choki",
    };
    
    const results = {
      targetYear,
      jenis: jenis || "all",
      grup: grup || "all",
      patterns: {},
      summary: {
        totalWithReplacement: 0,
        uniqueWeeks: new Set(),
        weekCounts: {},
      }
    };
    
    // Process each jenis if not specified
    const jenisList = jenis ? [jenis] : Object.keys(pmTables);
    
    for (const j of jenisList) {
      if (!pmTables[j]) continue;
      
      const tableName = pmTables[j];
      let whereClause = {};
      
      // Filter by grup if specified
      if (grup) {
        whereClause.grup = grup;
      }
      
      const rows = await automationDB[tableName].findMany({
        where: whereClause,
        select: {
          machine_name: true,
          periode: true,
          periode_start: true,
          grup: true,
        },
      });
      
      const patterns = [];
      
      for (const row of rows) {
        if (!hasReplacementInPeriode(row.periode)) {
          continue;
        }
        
        const replacementPattern = calculateReplacementPattern(
          row.periode,
          row.periode_start,
          targetYear
        );
        
        if (replacementPattern.length > 0) {
          results.summary.totalWithReplacement++;
          
          // Add to unique weeks
          replacementPattern.forEach(p => {
            results.summary.uniqueWeeks.add(`${p.year}w${p.week}`);
            const weekKey = `week_${p.week}`;
            results.summary.weekCounts[weekKey] = (results.summary.weekCounts[weekKey] || 0) + 1;
          });
          
          // Find nearest replacement (use current week from getLastWeekRolling4)
          const currentRolling = getLastWeekRolling4(1);
          const currentWeek = currentRolling[0] || { week: 1, year: targetYear };
          const nearest = replacementPattern
            .filter(p => {
              if (p.year > currentWeek.year) return true;
              if (p.year === currentWeek.year && p.week >= currentWeek.week) return true;
              return false;
            })
            .sort((a, b) => {
              if (a.year !== b.year) return a.year - b.year;
              return a.week - b.week;
            })[0];
          
          patterns.push({
            machine_name: row.machine_name,
            grup: row.grup,
            periode: row.periode,
            periode_start: row.periode_start,
            replacementWeeks: replacementPattern.map(p => `${p.year}w${p.week}`),
            nearestReplacement: nearest ? `${nearest.year}w${nearest.week}` : null,
            weekCount: replacementPattern.length,
          });
        }
      }
      
      // Sort by nearest replacement
      patterns.sort((a, b) => {
        if (!a.nearestReplacement) return 1;
        if (!b.nearestReplacement) return -1;
        return a.nearestReplacement.localeCompare(b.nearestReplacement);
      });
      
      results.patterns[j] = {
        count: patterns.length,
        data: patterns.slice(0, 100), // Limit to 100 untuk response size
        allCount: patterns.length,
      };
    }
    
    // Convert Set to Array for JSON
    results.summary.uniqueWeeks = Array.from(results.summary.uniqueWeeks)
      .sort()
      .slice(0, 52); // Limit to 52 weeks
    
    // Sort week counts
    const sortedWeekCounts = Object.entries(results.summary.weekCounts)
      .map(([key, count]) => ({
        week: parseInt(key.replace('week_', '')),
        count
      }))
      .sort((a, b) => a.week - b.week);
    
    results.summary.weekCounts = sortedWeekCounts;
    results.summary.totalUniqueWeeks = results.summary.uniqueWeeks.length;
    
    res.status(200).json({
      success: true,
      message: "Replacement patterns analysis",
      results,
    });
  } catch (err) {
    console.error("[TEST] Error in testReplacementPatterns:", err);
    res.status(500).json({
      success: false,
      error: "Failed to analyze replacement patterns",
      details: err.message,
    });
  }
}


// Function to execute cron job logic (extracted from pmWeekly.cron.js)
export async function executePmWeeklyCron() {
  console.log("[CRON] PM WEEKLY START");

  const results = {
    jobs: [],
    emails: [],
    errors: [],
  };

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
      results.errors.push({
        type: "email",
        error: "No weeks range returned from getEmailWeeksRange",
      });
      return results;
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
        let skippedDetails = [];
        let debugSamples = [];

        for (const row of pmRows) {
          if (!hasReplacementInPeriode(row.periode)) continue;
          withReplacement++;

          // Loop untuk SEMUA minggu di windowWeeks
          for (const w of windowWeeks) {
            const targetWeek = w.week;
            const targetYear = w.year;

            // PERBAIKAN: Gunakan calculateReplacementPattern sebagai fallback
            // karena isReplacementAtTargetWeek mungkin tidak akurat
            const pattern = calculateReplacementPattern(row.periode, row.periode_start, targetYear);
            const isEligible = pattern.some(p => p.week === targetWeek && p.year === targetYear);
            
            // Debug: simpan beberapa sample untuk inspection
            if (debugSamples.length < 3 && isEligible) {
              debugSamples.push({
                machine: row.machine_name,
                periode: row.periode,
                periode_start: row.periode_start,
                targetWeek: `${targetYear}w${targetWeek}`,
                pattern: pattern.map(p => `${p.year}w${p.week}`),
              });
            }
            
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
              if (skippedDetails.length < 10) {
                skippedDetails.push(`${row.machine_name} (grup ${row.grup}) - ${targetYear}w${targetWeek}`);
              }
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

        // Log skipped duplicates
        if (skippedDetails.length > 0) {
          console.log(`[CRON] Duplicates skipped for ${jenis} (${duplicates} total):`, skippedDetails.join(", "));
          if (duplicates > skippedDetails.length) {
            console.log(`[CRON] ... and ${duplicates - skippedDetails.length} more`);
          }
        }

        results.jobs.push({
          jenis,
          status: inserted > 0 ? "success" : "no_data",
          message: inserted > 0
            ? `Created ${inserted} new PM records`
            : `No new PM for ${jenis}`,
          count: inserted,
          debug: {
            windowWeeks: windowWeeks.map(w => `${w.year}w${w.week}`),
            totalPM: pmRows.length,
            withReplacement,
            eligibleMatches,
            duplicatesSkipped: duplicates,
            inserted,
            samples: debugSamples,
          },
        });
      } catch (err) {
        console.error(`[CRON] Error processing ${jenis}:`, err);
        results.jobs.push({
          jenis,
          status: "error",
          message: err.message,
        });
        results.errors.push({
          type: "job",
          jenis,
          error: err.message,
        });
      }
    }

    // Step 2: Send Emails (menggunakan email window 4 minggu)
    console.log("[CRON] FRIDAY EMAIL MODE");

    const or = emailWeeks.map(w => ({
      target_week: String(w.week),
      target_year: String(w.year),
    }));

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
          console.log(`[CRON] No PM rows for email (${jenis})`);
          results.emails.push({
            jenis: jenis,
            status: "no_data",
            message: `No PM rows for email (${jenis})`,
          });
          continue;
        }

        await sendEmailByJenisPMRange(jenis, rows, emailWeeks);
        console.log(`[CRON] Successfully sent email for ${jenis} (${rows.length} records)`);
        results.emails.push({
          jenis: jenis,
          status: "success",
          message: `Email sent for ${jenis}`,
          count: rows.length,
        });
      } catch (err) {
        console.error(`[CRON] Error sending email for ${jenis}:`, err);
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
      }
    }

    console.log("[CRON] PM WEEKLY DONE");
    return results;
  } catch (err) {
    console.error("[CRON] ERROR:", err);
    console.error("[CRON] ERROR Stack:", err.stack);
    results.errors.push({
      type: "general",
      error: err.message,
      stack: err.stack,
    });
    return results;
  }
}

// API endpoint to trigger cron job manually
export async function triggerPmWeeklyCron(req, res) {
  try {
    const results = await executePmWeeklyCron();
    
    res.status(200).json({
      success: true,
      message: "PM Weekly cron executed successfully",
      results: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[TRIGGER] Error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to execute PM Weekly cron",
      details: err.message,
    });
  }
}