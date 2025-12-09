import moment from "moment";
import { automationDB } from "../../../src/db/automation.js";
import { rawAutomation as raw } from "../../../config/sqlRaw.js";
import {
  JamListNormalShift1,
  JamListNormalShift2,
  JamListNormalShift3,
  JamListShortShift1,
  JamListShortShift2,
  Hourly,
  HourlyNextDay,
  NextHours
} from "../../../src/constant/jamShift.js";

function format(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2);
  const d = String(date.getDate()).padStart(2);
  return `${y}-${m}-${d}`;
}
function getMonthWeek(year, month, week) {
  let d = new Date(year, month - 1, 4);
  let day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setDate(d.getDate() + 7 * (week - 1));
  return d;
}
function getWeek(date) {
  let monthStart = new Date(date);
  monthStart.setDate(0);
  let offset = ((monthStart.getDay() + 1) % 7) - 1;
  return Math.ceil((date.getDate() + offset) / 7);
}
function getWeekDates(year, month, week) {
  let d = getMonthWeek(year, month, week);
  let arr = [];
  for (let i = 0; i < 7; i++) {
    arr.push(d.toLocaleDateString());
    d.setDate(d.getDate() + 1);
  }
  return arr;
}
// ==== BASIC PACKING L5 ====
export const GetPackingL5 = async (req, res) => {
  const rows = await automationDB.packing_l5.findMany({
    select: { id: true, cntr_bandet: true, cntr_carton: true, jam: true, tanggal: true },
    orderBy: { id: "desc" },
    take: 1
  });
  res.send(rows);
};
