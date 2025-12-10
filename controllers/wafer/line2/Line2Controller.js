import moment from "moment";
import { rawAutomation as raw, serializeBigInt } from "../../../config/sqlRaw.js";
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

// ====================== HELPERS ======================
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
export const GetPackingL2 = async (req, res) => {
  const data = await automationDB.packing_l2.findMany({
    orderBy: { id: "desc" },
    take: 1
  });
  res.send(data);
};
export const GetShift_L2 = async (req, res) => {
  const today = new Date();
  const data = await automationDB.counter_shift_l2.findMany({
    where: { tanggal: today },
    orderBy: { id: "desc" },
    take: 1
  });
  res.send(data);
};
// ==== SHIFT ====
export const GetShift1L2 = async (req, res) => {
  const today = new Date();
  const data = await automationDB.packing_l2.findMany({
    where: { tanggal: today, graph: "Y", jam: { in: JamListNormalShift1 } },
    orderBy: { id: "asc" }
  });
  res.send(data);
};
export const GetShift2L2 = async (req, res) => {
  const today = new Date();
  const data = await automationDB.packing_l2.findMany({
    where: { tanggal: today, graph: "Y", jam: { in: JamListNormalShift2 } },
    orderBy: { id: "asc" }
  });
  res.send(data);
};
export const GetShift3L2 = async (req, res) => {
  try {
    const today = new Date();
    const next = moment().add(1, "day").toDate();
  
    const d23 = await automationDB.packing_l2.findMany({
      where: { tanggal: today, graph: "Y", jam: "23.0" },
      orderBy: { id: "asc" }
    });
  
    const mapped = d23.map(r => ({
      jam: "0.23",
      counter: r.counter
    }));
  
    const dNext = await automationDB.packing_l2.findMany({
      where: { tanggal: next, graph: "Y", jam: { in: JamListNormalShift3 } },
      orderBy: { id: "asc" }
    });
  
    res.send(serializeBigInt(mapped.concat(dNext)));
  } catch (err) {
    console.error("Error /shift3_l2", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// ==== ini SHIFT L2 PACKING PERJAM ====
export const GetShift1L2Hourly = async (req, res) => {
  const today = new Date();
  const isSaturday = today.getDay() === 6;
  const date = format(today);

  const hours = isSaturday ? JamListShortShift1.saturday : JamListShortShift1.normal;

  const sql = `
      SELECT * FROM (
          SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
          FROM automation.packing_l2
          WHERE graph='Y' AND tanggal='${date}'
          AND jam IN (${hours.map(h => `'${h}'`).join(",")})
          ORDER BY jam, id ASC
      ) x ORDER BY id ASC
  `;

  const rows = await raw(sql);
  res.send(rows);
};
export const GetShift2L2Hourly = async (req, res) => {
  const today = new Date();
  const isSaturday = today.getDay() === 6;
  const date = format(today);

  const hours = isSaturday ? JamListShortShift2.saturday : JamListShortShift2.normal;

  const sql = `
      SELECT * FROM (
          SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
          FROM automation.packing_l2
          WHERE graph='Y' AND tanggal='${date}'
          AND jam IN (${hours.map(h => `'${h}'`).join(",")})
          ORDER BY jam, id ASC
      ) x ORDER BY id ASC
  `;

  const rows = await raw(sql);
  res.send(rows);
};
export const GetShift3L2Hourly = async (req, res) => {
  const today = moment();
  const isSaturday = today.day() === 6;
  const thisdaytime = today.format("YYYY-MM-DD");
  const nextDate = today.clone().add(1, "day").format("YYYY-MM-DD");

  if (isSaturday) {
    const sql = `
        SELECT * FROM (
            SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
            FROM automation.packing_l2
            WHERE graph='Y' AND tanggal='${thisdaytime}'
            AND jam IN ('17.45','18.45','19.45','20.45','21.45')
            ORDER BY jam, id ASC
        ) x ORDER BY id ASC
    `;
    const rows = await raw(sql);
    res.send(rows);
    return;
  }

  const sqlToday = `
      SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l2
      WHERE graph='Y' AND tanggal='${thisdaytime}'
      AND jam='23.45'
      ORDER BY jam, id ASC
  `;

  const d23 = await raw(sqlToday);

  const cart = d23.map(row => ({
    jam: "23.45",
    cntr_bandet: row.cntr_bandet,
    cntr_carton: row.cntr_carton
  }));

  const sqlNext = `
      SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l2
      WHERE graph='Y'
      AND tanggal='${nextDate}'
      AND jam IN (${NextHours.map(j => `'${j}'`).join(",")})
      ORDER BY jam, id ASC
  `;

  const nextData = await raw(sqlNext);
  res.send(cart.concat(nextData));
};
// ==== ini PACKING L2 ALL ====
export const GetPackingL2All = async (req, res) => {
  const data = await automationDB.packing_l2.findMany({
    where: { graph: "Y" },
    orderBy: { id: "desc" }
  });
  res.send(data);
};

// ==== ini PACKING L2 PERJAM & DATE ====
export const GetPackingL2Hourly = async (req, res) => {
  const today = format(new Date());

  const sql = `
      SELECT id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l2
      WHERE graph='Y'
      AND tanggal='${today}'
      AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
      ORDER BY id ASC
  `;

  const rows = await raw(sql);
  res.send(rows);
};
export const GetPackingL2HourlyByDate = async (req, res) => {
  const datethis = req.params.date;

  const nextDateObj = new Date(datethis);
  nextDateObj.setDate(nextDateObj.getDate() + 1);
  const nextDate = format(nextDateObj);

  const sqlToday = `
      SELECT id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l2
      WHERE graph='Y'
      AND tanggal='${datethis}'
      AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
      ORDER BY id ASC
  `;
  const todayRows = await raw(sqlToday);

  const sqlNext = `
      SELECT id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l2
      WHERE graph='Y'
      AND tanggal='${nextDate}'
      AND jam IN (${HourlyNextDay.map(j => `'${j}'`).join(",")})
      ORDER BY id ASC
  `;
  const nextRows = await raw(sqlNext);

  res.send(todayRows.concat(nextRows));
};
// ==== ini PACKING L2 DAILY & WEEKLY ====
export const GetPackingL2Daily = async (req, res) => {
  const today = format(new Date());

  const sql = `
      SELECT id, cntr_band_bandet, cntr_carton, jam
      FROM automation.packing_l2
      WHERE graph='Y'
      AND tanggal='${today}'
      AND jam IN ('14.58','22.58')
      ORDER BY id ASC
  `;
  const rows = await raw(sql);
  res.send(rows);
};
export const GetPackingL2DailyByDate = async (req, res) => {
  const datethis = req.params.date;

  let next = new Date(datethis);
  next.setDate(next.getDate() + 1);
  const nextDate = format(next);

  const sqlToday = `
      SELECT id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l2
      WHERE graph='Y'
      AND tanggal='${datethis}'
      AND jam IN ('14.45','22.45')
      ORDER BY id ASC
  `;
  const todayRows = await raw(sqlToday);

  const sqlNext = `
      SELECT id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l2
      WHERE graph='Y'
      AND tanggal='${nextDate}'
      AND jam IN ('6.45')
      ORDER BY id ASC
  `;
  const nextRows = await raw(sqlNext);

  res.send(todayRows.concat(nextRows));
};
export const GetPackingL2Weekly = async (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2);
  const weekIndex = getWeek(now);

  const dates = getWeekDates(year, month, weekIndex);
  const start = format(new Date(dates[0]));
  const end = format(new Date(dates[6]));

  const sql = `
      SELECT id, cntr_bandet, cntr_carton, jam, realdatetime
      FROM automation.packing_l2
      WHERE graph='Y'
      AND tanggal BETWEEN '${start}' AND '${end}'
      AND jam IN ('14.58','22.58','6.59')
      ORDER BY id ASC
  `;
  const rows = await raw(sql);
  res.send(rows);
};
export const GetPackingL2WeeklyByDate = async (req, res) => {
  const weekNum = Number(req.params.date);
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2);

  const dates = getWeekDates(year, month, weekNum);
  const start = format(new Date(dates[0]));
  const end = format(new Date(dates[6]));

  const sql = `
      SELECT id, cntr_bandet, cntr_carton, jam, realdatetime
      FROM automation.packing_l2
      WHERE graph='Y'
      AND tanggal BETWEEN '${start}' AND '${end}'
      AND jam IN ('14.58','22.58','6.59')
      ORDER BY id ASC
  `;
  const rows = await raw(sql);
  res.send(rows);
};