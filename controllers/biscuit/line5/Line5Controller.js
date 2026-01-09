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
  NextHours,
} from "../../../src/constant/jamShift.js";

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
    orderBy: { id: "desc" },
    take: 1,
  });
  res.send(rows);
};
export const GetShift_L5 = async (req, res) => {
  const today = new Date();

  const rows = await automationDB.counter_shift_l5.findMany({
    select: { shift1: true, shift2: true, shift3: true },
    where: { tanggal: today },
    orderBy: { id: "desc" },
    take: 1,
  });

  res.send(rows);
};
export const GetPackingL5All = async (req, res) => {
  const result = automationDB.packing_l5.findMany({
    where: { graph: "Y" },
    orderBy: { id: "desc" },
  });
  res.send(result);
};
// ==== SHIFT ====
export const GetShift1L5 = async (req, res) => {
  const today = new Date();
  const rows = await automationDB.packing_l5.findMany({
    select: { cntr_bandet: true, cntr_carton: true, jam: true },
    where: { tanggal: today, graph: "Y", jam: { in: JamListNormalShift1 } },
    orderBy: { id: "asc" },
  });
  res.send(rows);
};
export const GetShift2L5 = async (req, res) => {
  const today = new Date();
  const rows = await automationDB.packing_l5.findMany({
    select: { cntr_bandet: true, cntr_carton: true, jam: true },
    where: { tanggal: today, graph: "Y", jam: { in: JamListNormalShift2 } },
    orderBy: { id: "asc" },
  });
  res.send(rows);
};
export const GetShift3L5 = async (req, res) => {
  const today = format(new Date());
  const next = moment().add(1, "day").format("YYYY-MM-DD");

  const d23 = await raw(`
    SELECT cntr_bandet, cntr_carton
    FROM automation.packing_l5
    WHERE graph='Y' AND tanggal='${today}' AND jam='23.0'
    ORDER BY id ASC
  `);

  const mapped = d23.map((r) => ({
    jam: "0.23",
    cntr_bandet: r.cntr_bandet,
    cntr_carton: r.cntr_carton,
  }));

  const nextRows = await raw(`
    SELECT cntr_bandet, cntr_carton, jam
    FROM automation.packing_l5
    WHERE graph='Y' AND tanggal='${next}'
    AND jam IN (${JamListNormalShift3.map((j) => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  res.send(mapped.concat(nextRows));
};
// ==== SHIFT HOURLY ====
export const GetShift1L5Hourly = async (req, res) => {
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
export const GetShift2L5Hourly = async (req, res) => {
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
export const GetShift3L5Hourly = async (req, res) => {
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
// ==== SHIFT 3 BY DATE ====
export const GetShift3L5HourlyByDate = async (req, res) => {
  const thisDayTime = req.params.date;

  const nextDateObj = new Date(thisDayTime);
  nextDateObj.setDate(nextDateObj.getDate() + 1);
  const nextDate = format(nextDateObj);

  const todayRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l5
    WHERE graph='Y'
    AND tanggal = '${thisDayTime}'
    AND jam IN (${Hourly.map((j) => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  const nextRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l5
    WHERE graph='Y'
    AND tanggal = '${nextDate}'
    AND jam IN (${HourlyNextDay.map((j) => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  const finalRows = todayRows.concat(nextRows);

  return res.send(finalRows);
};
// ==== PACKING HOURLY ====
export const GetPackingL5Hourly = async (req, res) => {
  const today = format(new Date());

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l5
    WHERE graph='Y' AND tanggal='${today}'
    AND jam IN (${Hourly.map((j) => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  res.send(rows);
};
export const GetPackingL5HourlyByDate = async (req, res) => {
  const datethis = req.params.date;

  let nextObj = new Date(datethis);
  nextObj.setDate(nextObj.getDate() + 1);
  const nextDate = format(nextObj);

  const todayRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l5
    WHERE graph='Y' AND tanggal='${datethis}'
    AND jam IN (${Hourly.map((j) => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  const nextRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l5
    WHERE graph='Y' AND tanggal='${nextDate}'
    AND jam IN (${HourlyNextDay.map((j) => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  res.send(todayRows.concat(nextRows));
};
// ==== Daily & Weekly ====
export const GetPackingL5Daily = async (req, res) => {
  const today = format(new Date());

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l5
    WHERE graph='Y' AND tanggal='${today}'
    AND jam IN ('14.58','22.58')
    ORDER BY id ASC
  `);

  res.send(rows);
};
export const GetPackingL5DailyByDate = async (req, res) => {
  const datethis = req.params.date;

  let next = new Date(datethis);
  next.setDate(next.getDate() + 1);
  const nextDate = format(next);

  const todayRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l5
    WHERE graph='Y'
    AND tanggal='${datethis}'
    AND jam IN ('14.45','22.45')
    ORDER BY id ASC
  `);

  const nextRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l5
    WHERE graph='Y'
    AND tanggal='${nextDate}'
    AND jam='6.45'
    ORDER BY id ASC
  `);

  res.send(todayRows.concat(nextRows));
};
export const GetPackingL5Weekly = async (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2);
  const weekIndex = getWeek(now);

  const dates = getWeekDates(year, month, weekIndex);
  const start = format(new Date(dates[0]));
  const end = format(new Date(dates[6]));

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam, realdatetime
    FROM automation.packing_l5
    WHERE graph='Y'
    AND tanggal BETWEEN '${start}' AND '${end}'
    AND jam IN ('14.58','22.58','6.59')
    ORDER BY id ASC
  `);

  res.send(rows);
};
export const GetPackingL5WeeklyByDate = async (req, res) => {
  const weekNum = Number(req.params.date);
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2);

  const dates = getWeekDates(year, month, weekNum);
  const start = format(new Date(dates[0]));
  const end = format(new Date(dates[6]));

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam, realdatetime
    FROM automation.packing_l5
    WHERE graph='Y'
    AND tanggal BETWEEN '${start}' AND '${end}'
    AND jam IN ('14.58','22.58','6.59')
    ORDER BY id ASC
  `);

  res.send(rows);
};

export const GetTiltingL5 = async (req, res) => {
  const rows = await automationDB.tilting_l5.findMany({
    orderBy: { id: "desc" },
    take: 1,
  });
  res.send(rows);
};

export const GetTiltingHourlyL5 = async (req, res) => {
  const today = format(new Date());

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_tilting, jam
    FROM automation.tilting_l5
    WHERE graph='Y' AND tanggal='${today}'
    AND jam IN (${Hourly.map((j) => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  res.send(rows);
};

export const GetShift2L5TiltingHourly = async (req, res) => {
  const today = new Date();
  const isSaturday = today.getDay() === 6;
  const date = format(today);
  const hours = isSaturday ? JamListShortShift2.saturday : JamListShortShift2.normal;
  const sql = `
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_tilting, jam
    FROM automation.tilting_l5
    WHERE graph='Y' AND tanggal='${date}'
    AND jam IN (${hours.map((h) => `'${h}'`).join(",")})
    ORDER BY jam, id ASC
  `;
  const rows = await raw(sql);
  rows.sort((a, b) => a.id - b.id);
  res.send(rows);
};

export const GetShift1L5TiltingHourly = async (req, res) => {
  const today = new Date();
  const isSaturday = today.getDay() === 6;
  const date = format(today);
  const hours = isSaturday ? JamListShortShift1.saturday : JamListShortShift1.normal;
  const sql = `
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_tilting, jam
    FROM automation.tilting_l5
    WHERE graph='Y' AND tanggal='${date}'
    AND jam IN (${hours.map((h) => `'${h}'`).join(",")})
    ORDER BY jam, id ASC
  `;
  const rows = await raw(sql);
  rows.sort((a, b) => a.id - b.id);
  res.send(rows);
};

export const GetShift3L5TiltingHourly = async (req, res) => {
  const today = moment();
  const isSaturday = today.day() === 6;
  const date = format(today.toDate());
  const nextDate = format(today.clone().add(1, "day").toDate());

  if (isSaturday) {
    const sql = `
      SELECT DISTINCT ON (jam)
        id, cntr_bandet, cntr_tilting, jam
      FROM automation.tilting_l5
      WHERE graph='Y' AND tanggal='${date}'
      AND jam IN (${JamListShortShift3.saturday.map((h) => `'${h}'`).join(",")})
      ORDER BY jam, id ASC
    `;
    const rows = await raw(sql);
    rows.sort((a, b) => a.id - b.id);
    res.send(rows);
    return;
  }

  const d23 = await raw(`
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_tilting, jam
    FROM automation.tilting_l5
    WHERE graph='Y' AND tanggal='${date}'
    AND jam='23.45'
    ORDER BY jam, id ASC
  `);
  const mapped = d23.map((r) => ({
    id: r.id,
    jam: "0.23",
    cntr_bandet: r.cntr_bandet,
    cntr_tilting: r.cntr_tilting,
  }));

  const nextRows = await raw(`
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_tilting, jam
    FROM automation.tilting_l5
    WHERE graph='Y' AND tanggal='${nextDate}'
    AND jam IN (${NextHours.map((h) => `'${h}'`).join(",")})
    ORDER BY jam, id ASC
  `);

  const combined = mapped.concat(nextRows);
  combined.sort((a, b) => a.id - b.id);
  res.send(combined);
};

export const GetTiltingShift_L5 = async (req, res) => {
  const today = new Date();

  const rows = await automationDB.counter_shift_l5_tilting.findMany({
    select: { shift1: true, shift2: true, shift3: true },
    where: { tanggal: today },
    orderBy: { id: "desc" },
    take: 1,
  });

  res.send(rows);
};

export const GetTiltingL5Variance = async (req, res) => {
  try {
    // Query the latest data from tilting_l5 and packing_l5 tables
    const jumlah_batch = await automationDB.tilting_l5.findMany({
      orderBy: { id: "desc" },
      take: 1,
    });
    const jumlah_karton = await automationDB.packing_l5.findMany({
      orderBy: { id: "desc" },
      take: 1,
    });

    // Check if data exists
    if (
      !jumlah_batch ||
      jumlah_batch.length === 0 ||
      !jumlah_karton ||
      jumlah_karton.length === 0
    ) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    // Get values from query result
    const batch_value = Number(jumlah_batch[0]?.cntr_tilting ?? 0);
    const karton_value = Number(jumlah_karton[0]?.cntr_carton ?? 0);

    // Validate batch_value and karton_value
    if (
      isNaN(batch_value) ||
      isNaN(karton_value) ||
      batch_value === 0 ||
      karton_value === 0
    ) {
      return res.status(400).json({ message: "Nilai data tidak valid atau nol" });
    }

    // Constants
    const batch_value_hasil = batch_value;
    const bubuk_kering = 672.6;
    const standar_carton = 8.4;

    // Calculate variance
    const isi_variance =
      (karton_value * standar_carton) / (batch_value_hasil * bubuk_kering);

    const result = 100 - isi_variance * 100; // Percentage difference

    // Send the result in response
    res.json({
      karton_value: karton_value,
      batch_value: batch_value,
      isi_variance: isi_variance,
      jumlah_batch: jumlah_batch[0], // Return full data from query
      jumlah_karton: jumlah_karton[0], // Return full data from query
      bubuk_kering: bubuk_kering,
      standar_carton: standar_carton,
      variance_percentage: result.toFixed(2), // Two decimal places
    });
  } catch (error) {
    console.error(error); // Log error for debugging
    res
      .status(500)
      .json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};
