import {
  getLastWeekRolling4,
  hasReplacementInPeriode,
  isReplacementAtTargetWeek,
} from "../config/dateUtils.js";
import { automationDB } from "../src/db/automation.js";

export async function runUtilityPM() {
  const rolling = getLastWeekRolling4(4);

  const last = rolling[rolling.length - 1];
  const targetWeek = last.week;
  const targetYear = last.year;

  const rows = await automationDB.pm_utility.findMany();

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
    await automationDB.replacement_pm.create({
      data: { ...row, jenis_pm: "utility" },
    });
  }

  // console.log(`[UTILITY] synced week ${targetWeek}`);
  console.log(`[UTILITY] synced week ${targetYear}w${targetWeek}`);
}
