import {
  getLastWeekRolling4,
  hasReplacementInPeriode,
  isReplacementAtTargetWeek,
} from "../config/dateUtils.js";
import { automationDB } from "../src/db/automation.js";

export async function runWaferPM() {
  const rolling = getLastWeekRolling4(5);

  const last = rolling[rolling.length - 1];
  const targetWeek = last.week;
  const targetYear = last.year;

  const rows = await automationDB.pm_wafer.findMany();
  const createdRows = [];
  for (const row of rows) {
    if (!hasReplacementInPeriode(row.periode)) {
        continue;
    }
    if (
        !isReplacementAtTargetWeek(
        row.periode,
        row.periode_start,
        targetWeek,
        targetYear
        )
    ) {
        continue;
    }

    const {
      id,   
      status, 
      ...clean
    } = row;

    const created = await automationDB.replacement_pm.create({
      data: { 
        ...clean, 
        jenis_pm: "wafer", 
        status: 0, 
        target_week: String(targetWeek), 
        target_year: String(targetYear) 
      },
    });

    createdRows.push(created);
  }

  console.log(`[WAFER] synced week ${targetYear}w${targetWeek}`);
  return {
    rows: createdRows,
    targetWeek,
    targetYear,
  };
}