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
export const GetPackingRencengL2b = async (req, res) => {
  const rows = await automationDB.packing_l2b_malcok_renceng.findMany({
    orderBy: { id: "desc" },
    take: 1
  });
  res.send(rows);
};
export const GetPackingTrayL2b = async (req, res) => {
    const rows = await automationDB.packing_l2b_malcok_tray.findMany({
      orderBy: { id: "desc" },
      take: 1
    });
    console.log('Packing tray',rows)
    res.send(rows);
}
export const GetShift_L2b = async (req, res) => {
  const today = new Date();

  const rows = await automationDB.counter_shift_l2b.findMany({
    select: { shift1: true, shift2: true, shift3: true },
    where: { tanggal: today },
    orderBy: { id: "desc" },
    take: 1
  });

  console.log('Shift L2b',rows)
  res.send(rows);
};
export const GetPackingL2bRencengAll = async (req, res) => {
  const result = automationDB.packing_l2b_malcok_renceng.findMany({
    where: { graph: 'Y' },
    orderBy: { id: 'desc' }
  })
  console.log('Renceng All L2b',result)
  res.send(result);
}
export const GetPackingL2bTrayAll = async (req, res) => {
    const result = automationDB.packing_l2b_malcok_tray.findMany({
        where: { graph: 'Y' },
        orderBy: { id: 'desc' }
    })
    console.log('Tray All L2b',result)
    res.send(result);
}
// ==== SHIFT RENCENG DAN TRAY ====
export const GetShift1L2bRenceng = async (req, res) => {
  const today = new Date();
  const rows = await automationDB.packing_l2b_malcok_renceng.findMany({
    select: { cntr_bandet: true, cntr_carton: true, jam: true },
    where: { tanggal: today, graph: "Y", jam: { in: JamListNormalShift1 } },
    orderBy: { id: "asc" }
  });
  console.log('Shift 1 Renceng L2b',rows)
  res.send(rows);
}
export const GetShift2L2bRenceng = async (req, res) => {
  const today = new Date();
  const rows = await automationDB.packing_l2b_malcok_renceng.findMany({
    select: { cntr_bandet: true, cntr_carton: true, jam: true },
    where: { tanggal: today, graph: "Y", jam: { in: JamListNormalShift2 } },
    orderBy: { id: "asc" }
  });
  conso
  res.send(rows);
}
export const GetShift3L2bRenceng = async (req, res) => {
  const today = format(new Date());
  const next = moment().add(1, "day").format("YYYY-MM-DD");

  const d23 = await raw(`
    SELECT cntr_bandet, cntr_carton
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y' AND tanggal='${today}' AND jam='23.0'
    ORDER BY id ASC
  `);

  const mapped = d23.map(r => ({
    jam: "0.23",
    cntr_bandet: r.cntr_bandet,
    cntr_carton: r.cntr_carton
  }));

  const nextRows = await raw(`
    SELECT cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y' AND tanggal='${next}'
    AND jam IN (${JamListNormalShift3.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  res.send(mapped.concat(nextRows));
}
export const GetShift1L2bTray = async (req, res) => {
    const today = new Date();
    const rows = await automationDB.packing_l2b_malcok_tray.findMany({
        select: { cntr_bandet: true, cntr_carton: true, jam: true },
        where: { tanggal: today, graph: "Y", jam: { in: JamListNormalShift1 } },
        orderBy: { id: "asc" }
    });
    res.send(rows);
}
export const GetShift2L2bTray = async (req, res) => {
    const today = new Date();
    const rows = await automationDB.packing_l2b_malcok_tray.findMany({
        select: { cntr_bandet: true, cntr_carton: true, jam: true },
        where: { tanggal: today, graph: "Y", jam: { in: JamListNormalShift2 } },
        orderBy: { id: "asc" }
    });
    res.send(rows);
}
export const GetShift3L2bTray = async (req, res) => {
    const today = format(new Date());
    const next = moment().add(1, "day").format("YYYY-MM-DD");

    const d23 = await raw(`
        SELECT cntr_bandet, cntr_carton
        FROM automation.packing_l2b_malcok_tray
        WHERE graph='Y' AND tanggal='${today}' AND jam='23.0'
        ORDER BY id ASC
    `);

    const mapped = d23.map(r => ({
        jam: "0.23",
        cntr_bandet: r.cntr_bandet,
        cntr_carton: r.cntr_carton
    }));

    const nextRows = await raw(`
        SELECT cntr_bandet, cntr_carton, jam
        FROM automation.packing_l2b_malcok_tray
        WHERE graph='Y' AND tanggal='${next}'
        AND jam IN (${JamListNormalShift3.map(j => `'${j}'`).join(",")})
        ORDER BY id ASC
    `);

    res.send(mapped.concat(nextRows));

}
// ==== SHIFT HOURLY ====
export const GetShift1L2bRencengHourly = async (req, res) => {
  const today = new Date()
  const isSaturday = today.getDay() === 6
  const date = format(today)

  const hours = isSaturday ? JamListShortShift1.saturday : JamListShortShift1.normal

  const sql = `
    SELECT DISTINCT ON (jam)
        id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l2b_malcok_renceng
      WHERE graph='Y' AND tanggal='${date}'
      AND jam IN (${hours.map(h => `'${h}'`).join(",")})
      ORDER BY jam, id ASC
  `
  const rows = await raw(sql)
  res.send(rows)
}
export const GetShift2L2bRencengHourly = async (req, res) => {
  const today = new Date()
  const isSaturday = today.getDay() === 6
  const date = format(today)

  const hours = isSaturday ? JamListShortShift2.saturday : JamListShortShift2.normal

  const sql = `
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y' AND tanggal='${date}'
    AND jam IN (${hours.map(h => `'${h}'`).join(",")})
    ORDER BY jam, id ASC
  `
  const rows = await raw(sql)
  res.send(rows)
}
export const GetShift3L2bRencengHourly = async (req, res) => {
  const today = moment()
  const isSaturday = today.day() === 6
  const date = format(today.toDate())
  const nextDate = format(today.clone().add(1, "day").toDate())

  if (isSaturday) {
    const sql = `
      SELECT DISTINCT ON (jam)
        id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l2b_malcok_renceng
      WHERE graph='Y' AND tanggal='${date}'
      AND jam IN ('17.45','18.45','19.45','20.45','21.45')
      ORDER BY jam, id ASC
    `;
    const rows = await raw(sql);
    res.send(rows);
    return;
  }
  const d23 = await raw(`
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y' AND tanggal='${date}'
    AND jam='23.45'
    ORDER BY jam, id ASC
  `)
  const mapped = d23.map(r => ({
    jam: "0.23",
    cntr_bandet: r.cntr_bandet,
    cntr_carton: r.cntr_carton
  }))

  const nextRows = await raw(`
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l5
    WHERE graph='Y' AND tanggal='${nextDate}'
    AND jam IN (${NextHours.map(h => `'${h}'`).join(",")})
    ORDER BY jam, id ASC
  `)

  res.send(mapped.concat(nextRows))
}
export const GetShift1L2bTrayHourly = async (req, res) => {
  const today = new Date()
  const isSaturday = today.getDay() === 6
  const date = format(today)

  const hours = isSaturday ? JamListShortShift1.saturday : JamListShortShift1.normal

  const sql = `
    SELECT DISTINCT ON (jam)
        id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l2b_malcok_tray
      WHERE graph='Y' AND tanggal='${date}'
      AND jam IN (${hours.map(h => `'${h}'`).join(",")})
      ORDER BY jam, id ASC
  `
  const rows = await raw(sql)
  res.send(rows)
}
export const GetShift2L2bTrayHourly = async (req, res) => {
  const today = new Date()
  const isSaturday = today.getDay() === 6
  const date = format(today)

  const hours = isSaturday ? JamListShortShift2.saturday : JamListShortShift2.normal

  const sql = `
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_tray
    WHERE graph='Y' AND tanggal='${date}'
    AND jam IN (${hours.map(h => `'${h}'`).join(",")})
    ORDER BY jam, id ASC
  `
  const rows = await raw(sql)
  res.send(rows)
}
export const GetShift3L2bTrayHourly = async (req, res) => {
  const today = moment()
  const isSaturday = today.day() === 6
  const date = format(today.toDate())
  const nextDate = format(today.clone().add(1, "day").toDate())

  if (isSaturday) {
    const sql = `
      SELECT DISTINCT ON (jam)
        id, cntr_bandet, cntr_carton, jam
      FROM automation.packing_l2b_malcok_tray
      WHERE graph='Y' AND tanggal='${date}'
      AND jam IN ('17.45','18.45','19.45','20.45','21.45')
      ORDER BY jam, id ASC
    `;
    const rows = await raw(sql);
    res.send(rows);
    return;
  }
  const d23 = await raw(`
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_tray
    WHERE graph='Y' AND tanggal='${date}'
    AND jam='23.45'
    ORDER BY jam, id ASC
  `)
  const mapped = d23.map(r => ({
    jam: "0.23",
    cntr_bandet: r.cntr_bandet,
    cntr_carton: r.cntr_carton
  }))

  const nextRows = await raw(`
    SELECT DISTINCT ON (jam)
      id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l5
    WHERE graph='Y' AND tanggal='${nextDate}'
    AND jam IN (${NextHours.map(h => `'${h}'`).join(",")})
    ORDER BY jam, id ASC
  `)

  res.send(mapped.concat(nextRows))
}
// ==== SHIFT 3 BY DATE ====
export const GetShift3L2bRencengHourlyByDate = async (req, res) => {
  const thisDayTime = req.params.date;

  const nextDateObj = new Date(thisDayTime)
  nextDateObj.setDate(nextDateObj.getDate() + 1);
  const nextDate = format(nextDateObj);

  const todayRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y'
    AND tanggal = '${thisDayTime}'
    AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  const nextRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y'
    AND tanggal = '${nextDate}'
    AND jam IN (${HourlyNextDay.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  const finalRows = todayRows.concat(nextRows);

  return res.send(finalRows);
}
export const GetShift3L2bTrayHourlyByDate = async (req, res) => {
  const thisDayTime = req.params.date;

  const nextDateObj = new Date(thisDayTime)
  nextDateObj.setDate(nextDateObj.getDate() + 1);
  const nextDate = format(nextDateObj);

  const todayRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_tray
    WHERE graph='Y'
    AND tanggal = '${thisDayTime}'
    AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  const nextRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_tray
    WHERE graph='Y'
    AND tanggal = '${nextDate}'
    AND jam IN (${HourlyNextDay.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  const finalRows = todayRows.concat(nextRows);

  return res.send(finalRows);
}
// ==== PACKING HOURLY ====
export const GetPackingL2bRencengHourly = async (req, res) => {
  const today = format(new Date());

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y' AND tanggal='${today}'
    AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  res.send(rows);
}
export const GetPackingL2bRencengHourlyByDate = async (req, res) => {
  const datethis = req.params.date;

  let nextObj = new Date(datethis);
  nextObj.setDate(nextObj.getDate() + 1);
  const nextDate = format(nextObj);

  const todayRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y' AND tanggal='${datethis}'
    AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  const nextRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y' AND tanggal='${nextDate}'
    AND jam IN (${HourlyNextDay.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  res.send(todayRows.concat(nextRows));
}
export const GetPackingL2bTrayHourly = async (req, res) => {
  const today = format(new Date());

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_tray
    WHERE graph='Y' AND tanggal='${today}'
    AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  res.send(rows);
}
export const GetPackingL2bTrayHourlyByDate = async (req, res) => {
  const datethis = req.params.date;

  let nextObj = new Date(datethis);
  nextObj.setDate(nextObj.getDate() + 1);
  const nextDate = format(nextObj);

  const todayRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_tray
    WHERE graph='Y' AND tanggal='${datethis}'
    AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  const nextRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_tray
    WHERE graph='Y' AND tanggal='${nextDate}'
    AND jam IN (${HourlyNextDay.map(j => `'${j}'`).join(",")})
    ORDER BY id ASC
  `);

  res.send(todayRows.concat(nextRows));
}
// ==== Daily & Weekly ====
export const GetPackingL2bRencengDaily = async (req, res) => {
  const today = format(new Date());

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y' AND tanggal='${today}'
    AND jam IN ('14.58','22.58')
    ORDER BY id ASC
  `);

  res.send(rows);
};
export const GetPackingL2bRencengDailyByDate = async (req, res) => {
  const datethis = req.params.date;

  let next = new Date(datethis);
  next.setDate(next.getDate() + 1);
  const nextDate = format(next);

  const todayRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y'
    AND tanggal='${datethis}'
    AND jam IN ('14.45','22.45')
    ORDER BY id ASC
  `);

  const nextRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y'
    AND tanggal='${nextDate}'
    AND jam='6.45'
    ORDER BY id ASC
  `);

  res.send(todayRows.concat(nextRows));
};
export const GetPackingL2bTrayDaily = async (req, res) => {
  const today = format(new Date());

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_tray
    WHERE graph='Y' AND tanggal='${today}'
    AND jam IN ('14.58','22.58')
    ORDER BY id ASC
  `);

  res.send(rows);
};
export const GetPackingL2bTrayDailyByDate = async (req, res) => {
  const datethis = req.params.date;

  let next = new Date(datethis);
  next.setDate(next.getDate() + 1);
  const nextDate = format(next);

  const todayRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_tray
    WHERE graph='Y'
    AND tanggal='${datethis}'
    AND jam IN ('14.45','22.45')
    ORDER BY id ASC
  `);

  const nextRows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam
    FROM automation.packing_l2b_malcok_tray
    WHERE graph='Y'
    AND tanggal='${nextDate}'
    AND jam='6.45'
    ORDER BY id ASC
  `);

  res.send(todayRows.concat(nextRows));
};

export const GetPackingL2bRencengWeekly = async (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2);
  const weekIndex = getWeek(now);

  const dates = getWeekDates(year, month, weekIndex);
  const start = format(new Date(dates[0]));
  const end = format(new Date(dates[6]));

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam, realdatetime
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y'
    AND tanggal BETWEEN '${start}' AND '${end}'
    AND jam IN ('14.58','22.58','6.59')
    ORDER BY id ASC
  `);

  res.send(rows);
};
export const GetPackingL2bRencengWeeklyByDate = async (req, res) => {
  const weekNum = Number(req.params.date);
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2);

  const dates = getWeekDates(year, month, weekNum);
  const start = format(new Date(dates[0]));
  const end = format(new Date(dates[6]));

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam, realdatetime
    FROM automation.packing_l2b_malcok_renceng
    WHERE graph='Y'
    AND tanggal BETWEEN '${start}' AND '${end}'
    AND jam IN ('14.58','22.58','6.59')
    ORDER BY id ASC
  `);

  res.send(rows);
};
export const GetPackingL2bTrayWeekly = async (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2);
  const weekIndex = getWeek(now);

  const dates = getWeekDates(year, month, weekIndex);
  const start = format(new Date(dates[0]));
  const end = format(new Date(dates[6]));

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam, realdatetime
    FROM automation.packing_l2b_malcok_tray
    WHERE graph='Y'
    AND tanggal BETWEEN '${start}' AND '${end}'
    AND jam IN ('14.58','22.58','6.59')
    ORDER BY id ASC
  `);

  res.send(rows);
};
export const GetPackingL2bTrayWeeklyByDate = async (req, res) => {
  const weekNum = Number(req.params.date);
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2);

  const dates = getWeekDates(year, month, weekNum);
  const start = format(new Date(dates[0]));
  const end = format(new Date(dates[6]));

  const rows = await raw(`
    SELECT id, cntr_bandet, cntr_carton, jam, realdatetime
    FROM automation.packing_l2b_malcok_tray
    WHERE graph='Y'
    AND tanggal BETWEEN '${start}' AND '${end}'
    AND jam IN ('14.58','22.58','6.59')
    ORDER BY id ASC
  `);

  res.send(rows);
};