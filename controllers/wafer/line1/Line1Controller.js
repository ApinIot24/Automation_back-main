import moment from "moment";
import { rawAutomation as raw, serializeBigInt } from "../../../config/sqlRaw.js";
import { Hourly, HourlyNextDay, JamListNormalShift1, JamListNormalShift2, JamListNormalShift3, JamListShortShift1, JamListShortShift2, NextHours } from "../../../src/constant/jamShift.js";
import { automationDB } from "../../../src/db/automation.js";

function format(date) {
  if (!(date instanceof Date)) {
    throw new Error('Invalid "date" argument. You must pass a date instance');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getMonthWeek(year, month, week) {
  // Set date to 4th of month
  let d = new Date(year, month - 1, 4);
  // Get day number, set Sunday to 7
  let day = d.getDay() || 7;
  // Set to prior Monday
  d.setDate(d.getDate() - day + 1);
  // Set to required week
  d.setDate(d.getDate() + 7 * (week - 1));
  return d;
}
function getWeek(date) {
  let monthStart = new Date(date);
  monthStart.setDate(0);
  let offset = ((monthStart.getDay() + 1) % 7) - 1; // -1 is for a week starting on Monday
  return Math.ceil((date.getDate() + offset) / 7);
}
// Return array of dates for specified week of month of year
function getWeekDates(year, month, week) {
  let d = getMonthWeek(year, month, week);
  for (var i = 0, arr = []; i < 7; i++) {
    arr.push(d.toLocaleDateString());
    d.setDate(d.getDate() + 1);
  }
  return arr;
}
async function q(table, where = {}, orderBy = { id: "desc" }, limit) {
  return automationDB.packing_l1.findMany({
    where,
    orderBy,
    ...(limit && { take: limit })
  });
}

export const GetPackingL1 = async (req, res) => {
  const data = await q("packing_l1", {}, { id: "desc" }, 1);
  res.send(data);
}
export const GetShift_L1 = async (req, res) => {
    const today = new Date();
    const data = await automationDB.counter_shift_l1.findMany({
        where: { tanggal: today },
        orderBy: { id: "desc" },
        take: 1
    });
    res.send(data);
}
// ==== ini SHIFT L1 PACKING ====
export const getShift1L1 = async (req, res) => {
    const today = new Date();
    const data = await automationDB.packing_l1.findMany({
        where: {
        tanggal: today,
        graph: "Y",
        jam: { in: JamListNormalShift1 }
        },
        orderBy: { id: "asc" }
    })
    res.send(data);
}
export const GetShift2L1 = async (req, res) => {
    // const today = format(new Date());
    // const todayISO = new Date(today + "T00:00:00.000Z");
    const today = new Date()
    const data = await automationDB.packing_l1.findMany({
        where: { tanggal: today, graph: "Y", jam: { in: JamListNormalShift2 } },
        orderBy: { id: "asc" }
    });

    res.send(data);
}
export const GetShift3L1 = async (req, res) => {
  try {

    const today = format(new Date());
    const todayISO = new Date(today + "T00:00:00.000Z");
    const next = moment().add(1, "day").toDate();

    const d23 = await automationDB.packing_l1.findMany({
        where: { tanggal: todayISO, graph: "Y", jam: "23.0" },
        orderBy: { id: "asc" }
    });

    const mapped = d23.map((r) => ({
        jam: "0.23",
        counter: r.counter
    }))

    const dNext = await automationDB.packing_l1.findMany({
        where: { tanggal: next, graph: "Y", jam: { in: JamListNormalShift3 } },
        orderBy: { id: "asc" }
    })
    res.send(serializeBigInt(mapped.concat(dNext)));
  } catch (error) {
    console.error('Error in GET /shift3_l1:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
// ==== ini SHIFT L1 PACKING PERJAM ====
export const GetShift1L1Hourly = async (req, res) => {
    const today = new Date();
    const isSaturday = today.getDay() === 6;
    const date = format(today);

    const hours = isSaturday
        ? JamListShortShift1.saturday
        : JamListShortShift1.normal;

    const data = await raw(`
      SELECT * FROM (
        SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
        FROM automation.packing_l1
        WHERE graph='Y' AND tanggal='${date}' 
        AND jam IN (${hours.map(h => `'${h}'`).join(",")})
        ORDER BY jam, id ASC
      ) x ORDER BY id ASC
    `);

    res.send(data);
}
export const GetShift2L1Hourly = async (req, res) => {
    const today = new Date();
      const isSaturday = today.getDay() === 6;
      const date = format(today);
    
      const hours = isSaturday
        ? JamListShortShift2.saturday
        : JamListShortShift2.normal
    
      const sql = `
        SELECT * FROM (
          SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
          FROM automation.packing_l1
          WHERE graph = 'Y' AND tanggal = '${date}'
          AND jam IN (${hours.map(h => `'${h}'`).join(",")})
          ORDER BY jam, id ASC
        ) AS distinct_data
        ORDER BY id ASC
      `;
    
      const result = await raw(sql);
      res.send(result);
}
export const GetShift3L1Hourly = async (req, res) => {
    const today = moment();
      const isSaturday = today.day() === 6;
      const thisdaytime = today.format("YYYY-MM-DD");
      const nextDate = today.clone().add(1, "day").format("YYYY-MM-DD");
    
      // ====== SHIFT 3 KHUSUS SABTU ======
      if (isSaturday) {
        const sql = `
          SELECT * FROM (
            SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
            FROM automation.packing_l1
            WHERE graph = 'Y' AND tanggal = '${thisdaytime}'
            AND jam IN ('17.45','18.45','19.45','20.45','21.45')
            ORDER BY jam, id ASC
          ) x ORDER BY id ASC
        `;
    
        const rows = await raw(sql);
    
        const cart = rows.map(r => ({
          jam: r.jam,
          cntr_bandet: r.cntr_bandet,
          cntr_carton: r.cntr_carton,
        }));
    
        return res.send(cart);
      }
    
      // ====== SHIFT 3 HARI BIASA ======
      // Ambil 23.45 hari ini
      const sqlToday = `
        SELECT * FROM (
          SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
          FROM automation.packing_l1
          WHERE graph = 'Y' AND tanggal = '${thisdaytime}'
          AND jam = '23.45'
          ORDER BY jam, id ASC
        ) x ORDER BY id ASC
      `;
    
      const d23 = await raw(sqlToday);
    
      const cart = d23.map(r => ({
        jam: "23.45",
        cntr_bandet: r.cntr_bandet,
        cntr_carton: r.cntr_carton,
      }));

      const sqlNext = `
        SELECT * FROM (
          SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
          FROM automation.packing_l1
          WHERE graph = 'Y'
          AND tanggal = '${nextDate}'
          AND jam IN (${NextHours.map(j => `'${j}'`).join(",")})
          ORDER BY jam, id ASC
        ) x ORDER BY id ASC
      `;
    
      const dNext = await raw(sqlNext);
    
      res.send(cart.concat(dNext));
}
// ==== SHIFT 3 PACKING byDate ====
export const GetShift3L1HourByDate = async (req, res) => {
    const thisdaytime = req.params.date;
    
      const nextDateObj = new Date(thisdaytime);
      nextDateObj.setDate(nextDateObj.getDate() + 1);
      const nextDate = format(nextDateObj);
    
      // Ambil 23.45 hari ini
      const sqlToday = `
        SELECT * FROM (
          SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
          FROM automation.packing_l1
          WHERE graph = 'Y' AND tanggal = '${thisdaytime}'
          AND jam = '23.45'
          ORDER BY jam, id ASC
        ) x ORDER BY id ASC
      `;
    
      const d23 = await raw(sqlToday);
    
      const cart = d23.map(row => ({
        jam: "0.45",
        counter: row.cntr_bandet
      }));
    
      const sqlNext = `
        SELECT * FROM (
          SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
          FROM automation.packing_l1
          WHERE graph = 'Y'
          AND tanggal = '${nextDate}'
          AND jam IN (${NextHours.map(j => `'${j}'`).join(",")})
          ORDER BY jam, id ASC
        ) x ORDER BY id ASC
      `;
    
      const next = await raw(sqlNext);
    
      res.send(cart.concat(next));
}
// ==== ini PACKING L1 ALL ====
export const GetPackingL1All = async (req, res) => {
    const data = await automationDB.packing_l1.findMany({
        where: { graph: "Y" },
        orderBy: { id: "desc" }
    });

    res.send(data);
}
// ==== ini PACKING L1 PERJAM & DATE ====
export const GetPackingL1Hourly = async (req, res) => {
    const today = format(new Date());

    const sql = `
        SELECT id, cntr_bandet, cntr_carton, jam
        FROM automation.packing_l1
        WHERE graph='Y'
        AND tanggal='${today}'
        AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
        ORDER BY id ASC
    `;

    const rows = await raw(sql);
    res.send(rows);
}
export const GetPackingL1HourByDate = async (req, res) => {
    const datethis = req.params.date;

    // Besoknya
    const nextDateObj = new Date(datethis);
    nextDateObj.setDate(nextDateObj.getDate() + 1);
    const nextDate = format(nextDateObj);

    // Hari ini
    const sqlToday = `
      SELECT id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l1
      WHERE graph='Y'
      AND tanggal='${datethis}'
      AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
      ORDER BY id ASC
    `;

    const todayRows = await raw(sqlToday);

    // Hari berikutnya (shift lanjutan)
    const sqlNext = `
      SELECT id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l1
      WHERE graph='Y'
      AND tanggal='${nextDate}'
      AND jam IN (${HourlyNextDay.map(j => `'${j}'`).join(",")})
      ORDER BY id ASC
    `;

    const nextRows = await raw(sqlNext);

    res.send(todayRows.concat(nextRows));
}
// ==== ini PACKING L1 DAILY & WEEKLY ====
export const GetPackingL1Daily = async (req, res) => {
    const today = format(new Date());

  const sql = `
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l1
    WHERE graph='Y'
    AND tanggal='${today}'
    AND jam IN ('14.58','22.58')
    ORDER BY id ASC
  `;

  const rows = await raw(sql);
  res.send(rows);
}
export const GetPackingL1DailyByDate = async (req, res) => {
    const datethis = req.params.date;

    // Besoknya
    let next = new Date(datethis);
    next.setDate(next.getDate() + 1);
    const nextDate = format(next);

    // Hari ini
    const sqlToday = `
      SELECT id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l1
      WHERE graph='Y'
      AND tanggal='${datethis}'
      AND jam IN ('14.45','22.45')
      ORDER BY id ASC
    `;
    const todayRows = await raw(sqlToday);

    // Besok (jam lanjutan)
    const sqlNext = `
      SELECT id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l1
      WHERE graph='Y'
      AND tanggal='${nextDate}'
      AND jam IN ('6.45')
      ORDER BY id ASC
    `;
    const nextRows = await raw(sqlNext);

    res.send(todayRows.concat(nextRows));
}
export const GetPackingL1Weekly = async (req, res) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2);
    const weekIndex = getWeek(now);

    const dates = getWeekDates(year, month, weekIndex);

    const start = format(new Date(dates[0]));
    const end = format(new Date(dates[6]));

    const sql = `
        SELECT id, cntr_bandet, cntr_carton, jam, realdatetime
        FROM automation.packing_l1
        WHERE graph='Y'
        AND tanggal BETWEEN '${start}' AND '${end}'
        AND jam IN ('14.58','22.58','6.59')
        ORDER BY id ASC
    `;

    const rows = await raw(sql);
    res.send(rows);
}
export const GetPackingL1WeeklyByDate = async (req, res) => {
    const weekNum = Number(req.params.date);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2);

    // Ambil minggu tertentu
    const dates = getWeekDates(year, month, weekNum);

    const start = format(new Date(dates[0]));
    const end = format(new Date(dates[6]));

    const sql = `
        SELECT id, cntr_bandet, cntr_carton, jam, realdatetime
        FROM automation.packing_l1
        WHERE graph='Y'
        AND tanggal BETWEEN '${start}' AND '${end}'
        AND jam IN ('14.58','22.58','6.59')
        ORDER BY id ASC
    `;

    const rows = await raw(sql);
    res.send(rows);
}