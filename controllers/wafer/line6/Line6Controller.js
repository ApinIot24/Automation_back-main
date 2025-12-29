import moment from "moment";
import { rawAutomation as raw } from "../../../config/sqlRaw.js";
import {
  Hourly,
  HourlyNextDay,
  JamListNormalShift1,
  JamListNormalShift2,
  JamListNormalShift3,
  JamListShortShift1,
  JamListShortShift2,
  NextHours
} from "../../../src/constant/jamShift.js";
import { automationDB } from "../../../src/db/automation.js";

// ==== Helper Functions ====
function format(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
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
  const arr = [];
  for (let i = 0; i < 7; i++) {
    arr.push(d.toLocaleDateString());
    d.setDate(d.getDate() + 1);
  }
  return arr;
}

export const GetPackingL6 = async (req, res) => {
  const data = await automationDB.packing_l6.findMany({
    select: { id: true, cntr_bandet: true, cntr_carton: true, jam: true, tanggal: true },
    orderBy: { id: "desc" },
    take: 1
  });
  res.send(data);
};
export const GetPackingL6All = async (req, res) => {
  const data = await automationDB.packing_l6.findMany({
    select: { id: true, cntr_bandet: true, cntr_carton: true, jam: true, tanggal: true },
    where: { graph: "Y" },
    orderBy: { id: "desc" }
  });
  res.send(data);
};
export const GetShift_L6 = async (req, res) => {
  const today = new Date();
  const data = await automationDB.counter_shift_l6.findMany({
    select: { shift1: true, shift2: true, shift3: true, tanggal: true },
    where: { tanggal: today },
    orderBy: { id: "desc" },
    take: 1
  });
  res.send(data);
};
// ==== SHIFT ====
export const GetShift1L6 = async (req, res) => {
  const today = new Date();
  const rows = await automationDB.packing_l6.findMany({
    select: { cntr_bandet: true, cntr_carton: true, jam: true },
    where: { tanggal: today, graph: "Y", jam: { in: JamListNormalShift1 } },
    orderBy: { id: "asc" }
  });
  res.send(rows);
};
export const GetShift2L6 = async (req, res) => {
  const today = new Date();
  const rows = await automationDB.packing_l6.findMany({
    select: { cntr_bandet: true, cntr_carton: true, jam: true },
    where: { tanggal: today, graph: "Y", jam: { in: JamListNormalShift2 } },
    orderBy: { id: "asc" }
  });
  res.send(rows);
};
export const GetShift3L6 = async (req, res) => {
  const today = new Date();
  const next = moment().add(1, "day").toDate();

  const d23 = await automationDB.packing_l6.findMany({
    select: { cntr_bandet: true, cntr_carton: true },
    where: { tanggal: today, graph: "Y", jam: "23.0" },
    orderBy: { id: "asc" }
  });

  const mapped = d23.map(r => ({
    jam: "0.23",
    cntr_bandet: r.cntr_bandet,
    cntr_carton: r.cntr_carton
  }));

  const dNext = await automationDB.packing_l6.findMany({
    select: { cntr_bandet: true, cntr_carton: true, jam: true },
    where: { tanggal: next, graph: "Y", jam: { in: JamListNormalShift3 } },
    orderBy: { id: "asc" }
  });

  res.send(mapped.concat(dNext));
};
// ==== ini SHIFT L6 PACKING PERJAM ====
export const GetShift1L6Hourly = async (req, res) => {
  const today = new Date();
  const date = format(today);
  const isSaturday = today.getDay() === 6;

  const hours = isSaturday ? JamListShortShift1.saturday : JamListShortShift1.normal;

  const sql = `
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l6
    WHERE graph='Y' AND tanggal='${date}'
    AND jam IN (${hours.map(h => `'${h}'`).join(",")})
    ORDER BY jam, id ASC
  `;

  const rows = await raw(sql);
  // Sort by id ascending
  rows.sort((a, b) => a.id - b.id);
  res.send(rows);
};
export const GetShift2L6Hourly = async (req, res) => {
  const today = new Date();
  const date = format(today);
  const isSaturday = today.getDay() === 6;

  const hours = isSaturday ? JamListShortShift2.saturday : JamListShortShift2.normal;

  const sql = `
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l6
    WHERE graph='Y' AND tanggal='${date}'
    AND jam IN (${hours.map(h => `'${h}'`).join(",")})
    ORDER BY jam, id ASC
  `;

  const rows = await raw(sql);
  // Sort by id ascending
  rows.sort((a, b) => a.id - b.id);
  res.send(rows);
};
export const GetShift3L6Hourly = async (req, res) => {
  const today = moment();
  const isSaturday = today.day() === 6;
  const date = today.format("YYYY-MM-DD");
  const nextDate = today.clone().add(1, "day").format("YYYY-MM-DD");

  if (isSaturday) {
    const sql = `
      SELECT DISTINCT ON (jam)
        id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l6
      WHERE graph='Y' AND tanggal='${date}'
      AND jam IN ('17.45','18.45','19.45','20.45','21.45')
      ORDER BY jam, id ASC
    `;
    const rows = await raw(sql);
    // Sort by id ascending
    rows.sort((a, b) => a.id - b.id);
    res.send(rows);
    return;
  }

  const d23 = await raw(`
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l6
    WHERE graph='Y' AND tanggal='${date}' AND jam='23.45'
    ORDER BY jam, id ASC
  `);

  const mapped = d23.map(r => ({
    id: r.id,
    jam: "23.45",
    cntr_bandet: r.cntr_bandet,
    cntr_carton: r.cntr_carton
  }));

  const nextRows = await raw(`
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l6
    WHERE graph='Y' AND tanggal='${nextDate}'
    AND jam IN (${NextHours.map(j => `'${j}'`).join(",")})
    ORDER BY jam, id ASC
  `);

  const combined = mapped.concat(nextRows);
  // Sort by id ascending
  combined.sort((a, b) => a.id - b.id);
  res.send(combined);
};
// ==== ini PACKING L6 PERJAM & DATE ====
export const GetPackingL6Hourly = async (req, res) => {
  const today = format(new Date());

  const sql = `
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l6
    WHERE graph='Y' AND tanggal='${today}'
    AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `;

  const rows = await raw(sql);
  res.send(rows);
};
export const GetPackingL6HourlyByDate = async (req, res) => {
  const datethis = req.params.date;

  const nextObj = new Date(datethis);
  nextObj.setDate(nextObj.getDate() + 1);
  const nextDate = format(nextObj);

  const todayRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l6
    WHERE graph='Y'
    AND tanggal='${datethis}'
    AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  const nextRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l6
    WHERE graph='Y'
    AND tanggal='${nextDate}'
    AND jam IN (${HourlyNextDay.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  res.send(todayRows.concat(nextRows));
};
// ==== ini PACKING L6 DAILY & WEEKLY ====
export const GetPackingL6Daily = async (req, res) => {
  const today = format(new Date());

  const sql = `
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l6
    WHERE graph='Y'
    AND tanggal='${today}'
    AND jam IN ('14.58','22.58')
    ORDER BY id ASC
  `;

  const rows = await raw(sql);
  res.send(rows);
};
export const GetPackingL6DailyByDate = async (req, res) => {
  const datethis = req.params.date;

  let next = new Date(datethis);
  next.setDate(next.getDate() + 1);
  const nextDate = format(next);

  const todayRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l6
    WHERE graph='Y'
    AND tanggal='${datethis}'
    AND jam IN ('14.45','22.45')
    ORDER BY id ASC
  `);

  const nextRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l6
    WHERE graph='Y'
    AND tanggal='${nextDate}'
    AND jam='6.45'
    ORDER BY id ASC
  `);

  res.send(todayRows.concat(nextRows));
};
export const GetPackingL6Weekly = async (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2);
  const weekIndex = getWeek(now);

  const dates = getWeekDates(year, month, weekIndex);
  const start = format(new Date(dates[0]));
  const end = format(new Date(dates[6]));

  const sql = `
    SELECT id, cntr_bandet, cntr_carton, jam, realdatetime
    FROM automation.packing_l6
    WHERE graph='Y'
    AND tanggal BETWEEN '${start}' AND '${end}'
    AND jam IN ('14.58','22.58','6.59')
    ORDER BY id ASC
  `;
  const rows = await raw(sql);
  res.send(rows);
};
export const GetPackingL6WeeklyByDate = async (req, res) => {
  const weekNum = Number(req.params.date);
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2);

  const dates = getWeekDates(year, month, weekNum);
  const start = format(new Date(dates[0]));
  const end = format(new Date(dates[6]));

  const sql = `
    SELECT id, cntr_bandet, cntr_carton, jam, realdatetime
    FROM automation.packing_l6
    WHERE graph='Y'
    AND tanggal BETWEEN '${start}' AND '${end}'
    AND jam IN ('14.58','22.58','6.59')
    ORDER BY id ASC
  `;

  const rows = await raw(sql);
  res.send(rows);
};