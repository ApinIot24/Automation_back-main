import { getShiftDataForDate, getShiftDataToday } from "../../../../config/shiftHelper.js";
import { rawIot as raw, serializeBigInt } from "../../../../config/sqlRaw.js";
import { Hourly, HourlyNextDay, JamListNormalShift1, JamListNormalShift2, JamListNormalShift3 } from "../../../../src/constant/jamShift.js";
import { iotDB } from "../../../../src/db/iot.js"
import moment from "moment";

/**
 * Helper function: format date menjadi YYYY-MM-DD
 */
function format(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error('Invalid "date" argument. You must pass a valid Date instance');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Mendapatkan Date object di awal minggu ke-n pada suatu bulan dan tahun
 */
function getMonthWeek(year, month, week) {
  // Set date ke tanggal 4 agar aman tidak salah bulan
  let d = new Date(year, month - 1, 4);
  // Dapatkan hari (Minggu = 0, set jadi 7)
  let day = d.getDay() || 7;
  // Mundur ke hari Senin terdekat sebelum/tepat 4
  d.setDate(d.getDate() - day + 1);
  // Maju ke minggu yang diinginkan
  d.setDate(d.getDate() + 7 * (week - 1));
  return d;
}

/**
 * Mendapatkan minggu ke-berapa di dalam suatu bulan
 * (Perhitungan mengikuti logika offset manual)
 */
function getWeek(date) {
  // Mengambil tanggal 1 di bulan berjalan
  let monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  // offset = jumlah hari "kelebihan" sebelum minggu penuh
  let offset = (monthStart.getDay() + 6) % 7;
  // Rumus perkiraan minggu
  return Math.ceil((date.getDate() + offset) / 7);
}

/**
 * Return array 7 tanggal (string) untuk minggu ke-n di (year, month)
 */
function getWeekDates(year, month, week) {
  let d = getMonthWeek(year, month, week);
  let arr = [];
  for (let i = 0; i < 7; i++) {
    // gunakan format(d) agar konsisten ke YYYY-MM-DD
    arr.push(d.toLocaleDateString());
    d.setDate(d.getDate() + 1);
  }
  return arr;
}

export const GetPackingA2 = async (req, res) => {
    try {
        const data = await iotDB.packing_a2.findMany({
            orderBy: { id: 'desc' },
            take: 1
        })
        res.json(serializeBigInt(data));
    } catch (error) {
        console.error('Error in GET /packing_a2:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA2All = async (req, res) => {
    try {
        const data = await iotDB.packing_a2.findMany({
            where: { graph: 'Y' },
            orderBy: { id: 'desc' }
        })
        res.json(serializeBigInt(data));
    } catch (error) {
        console.error('Error in GET /packing_a2_all:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA2Counter = async (req, res) => {
    try {
        const data = await iotDB.packing_a2.findMany({
            where: { graph: 'Y' },
            orderBy: { id: 'desc' },
            take: 7
        })
        res.json(serializeBigInt(data.map((d) => d.counter)));
    } catch (error) {
        console.error('Error in GET /packing_a2_counter:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
// ==== SHIFT ====
export const GetPackingA2Shift1 = async (req, res) => {
    try {
        const data = await getShiftDataToday(
            iotDB.packing_a2,
            JamListNormalShift1,
            "Y"
        ) 
        res.json(data);
    } catch (error) {
        console.error('Error in GET /shift1_a2:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA2Shift2 = async (req, res) => {
  try {
    const data = await getShiftDataToday(
        iotDB.packing_a2,
        JamListNormalShift2,
        "Y"
    )
    res.json(data);
  } catch (error) {
    console.error('Error in GET /shift2_a2:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
export const GetPackingA2Shift3 = async (req, res) => {
    try {
        const today = format(new Date())
        const next = moment().add(1, 'days').toDate()

        const d23 = await getShiftDataForDate(
            iotDB.packing_a2,
            ['22.47'],
            today,
            "Y"
        )
        const mapped = d23.map((r) => ({
            jam: '0.23',
            counter: r.counter
        }))

        const dNext = await getShiftDataForDate(
            iotDB.packing_a2,
            JamListNormalShift3,
            next,
            "Y"
        )
        res.json(serializeBigInt(mapped.concat(dNext)))
    } catch (error) {
        console.error('Error in GET /shift3_a2:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
// ==== HOURLY & WITH DATE PARAMETER ====
export const GetPackingA2Hourly = async (req, res) => {
    try {
        const today = new Date()
        const data = await iotDB.packing_a2.findMany({
            where: { tanggal: today, graph: 'Y', jam: { in: Hourly } },
            select: { id: true, counter: true, time: true, jam: true },
            orderBy: { id: 'asc' }
        })
        res.json(data)
    } catch (error) {
        console.error('Error in GET /packing_a2_hourly:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA2HourlyByDate = async (req, res) => {
    try {
        const dateThis = req.params.date
        const nextDateObj = new Date(dateThis)
        nextDateObj.setDate(nextDateObj.getDate() + 1)
        const nextDate = format(nextDateObj)

        const sqlToday = `
            SELECT id, counter, time, jam
            FROM purwosari.packing_a2
            WHERE graph = 'Y'
            AND tanggal = '${dateThis}'
            AND jam IN (${Hourly.map(j => `'${j}'`).join(',')})
            ORDER BY id ASC
        `
        const todayRows = await raw(sqlToday)
        
        const sqlNext = `
            SELECT id, counter, time, jam
            FROM purwosari.packing_a2
            WHERE graph = 'Y'
            AND tanggal = '${nextDate}'
            AND jam IN (${HourlyNextDay.map(j => `'${j}'`).join(',')})
            ORDER BY id ASC
        `
        const nextRows = await raw(sqlNext)
        res.send(todayRows.concat(nextRows))
    } catch (error) {
        console.error('Error in GET /packing_a2_hourly/date/:date:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
// ==== DAILY & WEEKLY ====
export const GetPackingA2Daily = async (req, res) => {
    try {
        const today = new Date()
        const data = await iotDB.packing_a2.findMany({
            where: { tanggal: today, graph: 'Y', jam: { in: ['14.58','22.58'] } },
            select: { id: true, counter: true, jam: true },
            orderBy: { id: 'asc' }
        })
        res.json(data)
    } catch (error) {
        console.error('Error in GET /packing_a2_daily:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA2DailyByDate = async (req, res) => {
    try {
        const datethis = req.params.date;

        let next = new Date(datethis);
        next.setDate(next.getDate() + 1);
        const nextDate = format(next);

        const sqlToday = `
            SELECT id, counter, jam
            FROM purwosari.packing_a2
            WHERE graph = 'Y'
            AND tanggal = '${datethis}'
            AND jam IN ('14.58','22.58')
            ORDER BY id ASC
        `
        const todayRows = await raw(sqlToday)
        
        const sqlNext = `
            SELECT id, counter, jam
            FROM purwosari.packing_a2
            WHERE graph = 'Y'
            AND tanggal = '${nextDate}'
            AND jam IN ('6.59')
            ORDER BY id ASC
        `
        const nextRows = await raw(sqlNext)
        res.send(todayRows.concat(nextRows))
    } catch(error) {
        console.error('Error in GET /packing_a2_daily/date/:date:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA2Weekly = async (req, res) => {
    try {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2);
        const weekIndex = getWeek(date);

        const dates = getWeekDates(year, month, weekIndex);

        const start = format(new Date(dates[0]));
        const end = format(new Date(dates[6]));

        const sql = `
            SELECT id, counter, jam, realdatetime
            FROM purwosari.packing_a2
            WHERE graph = 'Y'
            AND tanggal BETWEEN '${start}' AND '${end}'
            AND jam IN ('14.58','22.58','6.59')
            ORDER BY id ASC
        `
        const rows = await raw(sql);
        res.json(rows);
    } catch (error) {
        console.error('Error in GET /packing_a2_weekly:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA2WeeklyByDate = async (req, res) => {
    try {
        const weekNum = Number(req.params.date)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2);

        const dates = getWeekDates(year, month, weekNum);

        const start = format(new Date(dates[0]));
        const end = format(new Date(dates[6]));

        const sql = `
            SELECT id, counter, jam, realdatetime
            FROM purwosari.packing_a2
            WHERE graph = 'Y'
            AND tanggal BETWEEN '${start}' AND '${end}'
            AND jam IN ('14.58','22.58','6.59')
            ORDER BY id ASC
        `
        const rows = await raw(sql)
        res.json(rows);
    } catch (error) {
        console.error('Error in GET /packing_a2_weekly/date/:date:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}