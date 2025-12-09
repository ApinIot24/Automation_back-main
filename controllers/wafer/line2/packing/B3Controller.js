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

// Helper functions
function format(date) {
  if (!(date instanceof Date) || isNaN(date)) throw new Error("Invalid date");
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
  let out = [];
  for (let i = 0; i < 7; i++) {
    out.push(format(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// ==== Packing B3 Controllers ====
export const GetPackingB3 = async (req, res) => {
  try {
    const rows = await iotDB.packing_b3.findMany({
      orderBy: { id: "desc" },
      take: 1
    });
    res.json(serializeBigInt(rows));
  } catch (err) {
    console.error("Error /packing_b3", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB3All = async (req, res) => {
  try {
    const rows = await iotDB.packing_b3.findMany({
      where: { graph: "Y" },
      orderBy: { id: "desc" }
    });
    res.json(serializeBigInt(rows));
  } catch (err) {
    console.error("Error /packing_b3_all", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB3Counter = async (req, res) => {
  try {
    const rows = await iotDB.packing_b3.findMany({
      orderBy: { id: "desc" },
      select: { counter: true },
      take: 7
    });
    res.json(serializeBigInt(rows.map(r => r.counter)));
  } catch (err) {
    console.error("Error /packing_b3_counter", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// ==== SHIFT ====
export const GetPackingB3Shift1 = async (req, res) => {
  try {
    const data = await getShiftDataToday(
      iotDB.packing_b3,
      JamListNormalShift1,
      "Y"
    );
    res.json(data);
  } catch (err) {
    console.error("Error /shift1_b3", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB3Shift2 = async (req, res) => {
  try {
    const data = await getShiftDataToday(
      iotDB.packing_b3,
      JamListNormalShift2,
      "Y"
    );
    res.json(data);
  } catch (err) {
    console.error("Error /shift2_b3", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB3Shift3 = async (req, res) => {
  try {
    const today = format(new Date());
    const nextDay = moment().add(1, "days").toDate();

    const d23 = await getShiftDataForDate(
      iotDB.packing_b3,
      ["23.0"],
      today,
      "Y"
    );

    const mapped = d23.map(r => ({
      jam: "0.23",
      counter: r.counter
    }));

    const dNext = await getShiftDataForDate(
      iotDB.packing_b3,
      JamListNormalShift3,
      nextDay,
      "Y"
    );

    res.json(mapped.concat(dNext));
  } catch (err) {
    console.error("Error /shift3_b3", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// ==== HOURLY & BY DATE ====
export const GetPackingB3Hourly = async (req, res) => {
  try {
    const today = new Date();

    const rows = await iotDB.packing_b3.findMany({
      where: { tanggal: today, graph: "Y", jam: { in: Hourly } },
      select: { id: true, counter: true, time: true, jam: true },
      orderBy: { id: "asc" }
    });

    res.json(serializeBigInt(rows));
  } catch (err) {
    console.error("Error /packing_b3_hourly", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB3HourlyByDate = async (req, res) => {
  try {
    const dateThis = req.params.date;

    const nextObj = new Date(dateThis);
    nextObj.setDate(nextObj.getDate() + 1);
    const next = format(nextObj);

    const sqlToday = `
      SELECT id, counter, time, jam
      FROM purwosari.packing_b3
      WHERE graph='Y'
        AND tanggal='${dateThis}'
        AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
      ORDER BY id ASC
    `;
    const todayRows = await raw(sqlToday);

    const sqlNext = `
      SELECT id, counter, time, jam
      FROM purwosari.packing_b3
      WHERE graph='Y'
        AND tanggal='${next}'
        AND jam IN (${HourlyNextDay.map(j => `'${j}'`).join(",")})
      ORDER BY id ASC
    `;
    const nextRows = await raw(sqlNext);

    res.json(serializeBigInt(todayRows.concat(nextRows)));
  } catch (err) {
    console.error("Error /packing_b3_hourly/date", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// ==== Daily & Weekly ====
export const GetPackingB3Daily = async (req, res) => {
  try {
    const today = new Date();

    const rows = await iotDB.packing_b3.findMany({
      where: { tanggal: today, graph: "Y", jam: { in: ["14.58", "22.58"] } },
      select: { id: true, counter: true, jam: true },
      orderBy: { id: "asc" }
    });

    res.json(serializeBigInt(rows));
  } catch (err) {
    console.error("Error /packing_b3_daily", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB3DailyByDate = async (req, res) => {
  try {
    const dateThis = req.params.date;

    const nextObj = new Date(dateThis);
    nextObj.setDate(nextObj.getDate() + 1);
    const next = format(nextObj);

    const sqlToday = `
      SELECT id, counter, jam
      FROM purwosari.packing_b3
      WHERE graph='Y'
        AND tanggal='${dateThis}'
        AND jam IN ('14.58','22.58')
      ORDER BY id ASC
    `;
    const todayRows = await raw(sqlToday);

    const sqlNext = `
      SELECT id, counter, jam
      FROM purwosari.packing_b3
      WHERE graph='Y'
        AND tanggal='${next}'
        AND jam IN ('6.59')
      ORDER BY id ASC
    `;
    const nextRows = await raw(sqlNext);

    res.json(serializeBigInt(todayRows.concat(nextRows)));
  } catch (err) {
    console.error("Error /packing_b3_daily/date", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB3Weekly = async (req, res) => {
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
      FROM purwosari.packing_b3
      WHERE graph='Y'
        AND tanggal BETWEEN '${start}' AND '${end}'
        AND jam IN ('14.58','22.58','6.59')
      ORDER BY id ASC
    `;
    const rows = await raw(sql);

    res.json(serializeBigInt(rows));
  } catch (err) {
    console.error("Error /packing_b3_weekly", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const GetPackingB3WeeklyByDate = async (req, res) => {
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
      FROM purwosari.packing_b3
      WHERE graph='Y'
        AND tanggal BETWEEN '${start}' AND '${end}'
        AND jam IN ('14.58','22.58','6.59')
      ORDER BY id ASC
    `;
    const rows = await raw(sql);

    res.json(serializeBigInt(rows));
  } catch (err) {
    console.error("Error /packing_b3_weekly/date", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};