import {
  getLastWeekRolling4,
  hasReplacementInPeriode,
  isReplacementAtTargetWeek,
} from "../config/dateUtils.js";
import { automationDB } from "../src/db/automation.js";

export async function runAstorPM() {
  const rolling = getLastWeekRolling4(5);

  const last = rolling[rolling.length - 1];
  const targetWeek = last.week;
  const targetYear = last.year;

  const rows = await automationDB.pm_astor.findMany();
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

    // Check if already exists to prevent duplicate
    const exists = await automationDB.replacement_pm.findFirst({
      where: {
        jenis_pm: "astor",
        target_week: String(targetWeek),
        target_year: String(targetYear),
        machine_name: row.machine_name,
        grup: row.grup,
      },
    });

    if (exists) {
      continue; // Skip if already exists
    }

    const {
      id,   
      status, 
      ...clean
    } = row;

    const created = await automationDB.replacement_pm.create({
      data: { 
        ...clean, 
        jenis_pm: "astor", 
        status: 0, 
        target_week: String(targetWeek),
        target_year: String(targetYear), },
    });

    createdRows.push(created);
  }

  console.log(`[ASTOR] synced week ${targetYear}w${targetWeek}`);

  return {
    rows: createdRows,
    targetWeek,
    targetYear,
  };
}