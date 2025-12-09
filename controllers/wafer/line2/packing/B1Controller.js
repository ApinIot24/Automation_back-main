// B1Controller.js
import moment from "moment";
import {
  Hourly,
  HourlyNextDay,
  JamListNormalShift1,
  JamListNormalShift2,
  JamListNormalShift3
} from "../../../../src/constant/jamShift.js";
import { iotDB } from "../../../../src/db/iot.js";
import { rawIot as raw, serializeBigInt } from "../../../../config/sqlRaw.js";
import { getShiftDataToday, getShiftDataForDate } from "../../../../config/shiftHelper.js";

/* ===========================
      HELPER FUNCTIONS
=========================== */
function format(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error("Invalid date");
  }
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
  let start = new Date(date.getFullYear(), date.getMonth(), 1);
  let offset = (start.getDay() + 6) % 7;
  return Math.ceil((date.getDate() + offset) / 7);
}
function getWeekDates(year, month, week) {
  let d = getMonthWeek(year, month, week);
  let arr = [];
  for (let i = 0; i < 7; i++) {
    arr.push(format(d));
    d.setDate(d.getDate() + 1);
  }
  return arr;
}

// ==== Packing B1 Controllers ====
export const GetPackingB1 = async (req, res) => {
  try {
    const rows = await iotDB.packing_b1.findMany({
      orderBy: { id: "desc" },
      take: 1
    });
    res.json(serializeBigInt(rows));
  } catch (err) {
    console.error("Error /packing_b1", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB1All = async (req, res) => {
  try {
    const rows = await iotDB.packing_b1.findMany({
      where: { graph: "Y" },
      orderBy: { id: "desc" }
    });
    res.json(serializeBigInt(rows));
  } catch (err) {
    console.error("Error /packing_b1_all", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB1Counter = async (req, res) => {
  try {
    const rows = await iotDB.packing_b1.findMany({
      orderBy: { id: "desc" },
      take: 7
    });
    res.json(serializeBigInt(rows.map(r => r.counter)));
  } catch (err) {
    console.error("Error /packing_b1_counter", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// ==== SHIFT ====
export const GetPackingB1Shift1 = async (req, res) => {
  try {
    const data = await getShiftDataToday(
      iotDB.packing_b1,
      JamListNormalShift1,
      "Y"
    );
    res.json(data);
  } catch (err) {
    console.error("Error /shift1_b1", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB1Shift2 = async (req, res) => {
  try {
    const data = await getShiftDataToday(
      iotDB.packing_b1,
      JamListNormalShift2,
      "Y"
    );
    res.json(data);
  } catch (err) {
    console.error("Error /shift2_b1", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB1Shift3 = async (req, res) => {
  try {
    const today = format(new Date());
    const nextDay = moment().add(1, "days").toDate();

    const d23 = await getShiftDataForDate(
      iotDB.packing_b1,
      ["23.0"],
      today,
      "Y"
    );

    const mapped = d23.map(r => ({
      jam: "0.23",
      counter: r.counter
    }));

    const dNext = await getShiftDataForDate(
      iotDB.packing_b1,
      JamListNormalShift3,
      nextDay,
      "Y"
    );

    res.json(mapped.concat(dNext));
  } catch (err) {
    console.error("Error /shift3_b1", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// ==== Hourly & By Date ====
export const GetPackingB1Hourly = async (req, res) => {
  try {
    const today = new Date();

    const rows = await iotDB.packing_b1.findMany({
      where: { tanggal: today, graph: "Y", jam: { in: Hourly } },
      orderBy: { id: "asc" }
    });

    res.json(serializeBigInt(rows));
  } catch (err) {
    console.error("Error /packing_b1_hourly", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB1HourlyByDate = async (req, res) => {
  try {
    const dateThis = req.params.date;

    const nextObj = new Date(dateThis);
    nextObj.setDate(nextObj.getDate() + 1);
    const next = format(nextObj);

    const sqlToday = `
      SELECT id, counter, time, jam
      FROM purwosari.packing_b1
      WHERE graph='Y'
        AND tanggal='${dateThis}'
        AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
      ORDER BY id ASC
    `;
    const todayRows = await raw(sqlToday);

    const sqlNext = `
      SELECT id, counter, time, jam
      FROM purwosari.packing_b1
      WHERE graph='Y'
        AND tanggal='${next}'
        AND jam IN (${HourlyNextDay.map(j => `'${j}'`).join(",")})
      ORDER BY id ASC
    `;
    const nextRows = await raw(sqlNext);

    res.json(serializeBigInt(todayRows.concat(nextRows)));
  } catch (err) {
    console.error("Error /packing_b1_hourly/date/:date", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//  ==== DAILY & WEEKLY ====
export const GetPackingB1Daily = async (req, res) => {
  try {
    const today = new Date();

    const rows = await iotDB.packing_b1.findMany({
      where: { tanggal: today, graph: "Y", jam: { in: ["14.58", "22.58"] } },
      orderBy: { id: "asc" }
    });

    res.json(serializeBigInt(rows));
  } catch (err) {
    console.error("Error /packing_b1_daily", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB1DailyByDate = async (req, res) => {
  try {
    const dateThis = req.params.date;

    const nextObj = new Date(dateThis);
    nextObj.setDate(nextObj.getDate() + 1);
    const next = format(nextObj);

    const sqlToday = `
      SELECT id, counter, jam
      FROM purwosari.packing_b1
      WHERE graph='Y'
        AND tanggal='${dateThis}'
        AND jam IN ('14.58','22.58')
      ORDER BY id ASC
    `;
    const todayRows = await raw(sqlToday);

    const sqlNext = `
      SELECT id, counter, jam
      FROM purwosari.packing_b1
      WHERE graph='Y'
        AND tanggal='${next}'
        AND jam IN ('6.59')
      ORDER BY id ASC
    `;
    const nextRows = await raw(sqlNext);

    res.json(serializeBigInt(todayRows.concat(nextRows)));
  } catch (err) {
    console.error("Error /packing_b1_daily/date/:date", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB1Weekly = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const weekIdx = getWeek(now);

    const dates = getWeekDates(year, month, weekIdx);
    const start = dates[0];
    const end = dates[6];

    const sql = `
      SELECT id, counter, jam, realdatetime
      FROM purwosari.packing_b1
      WHERE graph='Y'
        AND tanggal BETWEEN '${start}' AND '${end}'
        AND jam IN ('14.58','22.58','6.59')
      ORDER BY id ASC
    `;
    const rows = await raw(sql);

    res.json(serializeBigInt(rows));
  } catch (err) {
    console.error("Error /packing_b1_weekly", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB1WeeklyByDate = async (req, res) => {
  try {
    const weekNum = Number(req.params.date);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const dates = getWeekDates(year, month, weekNum);
    const start = dates[0];
    const end = dates[6];

    const sql = `
      SELECT id, counter, jam, realdatetime
      FROM purwosari.packing_b1
      WHERE graph='Y'
        AND tanggal BETWEEN '${start}' AND '${end}'
        AND jam IN ('14.58','22.58','6.59')
      ORDER BY id ASC
    `;
    const rows = await raw(sql);

    res.json(serializeBigInt(rows));
  } catch (err) {
    console.error("Error /packing_b1_weekly/date/:date", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};