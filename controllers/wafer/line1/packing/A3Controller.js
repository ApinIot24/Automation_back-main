import moment from "moment"
import { getShiftDataForDate, getShiftDataToday } from "../../../../config/shiftHelper.js"
import { Hourly, HourlyNextDay, JamListNormalShift1, JamListNormalShift2, JamListNormalShift3 } from "../../../../src/constant/jamShift.js"
import { automationDB } from "../../../../src/db/automation.js"
import { rawAutomation as raw, serializeBigInt } from "../../../../config/sqlRaw.js"

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
  // Set date ke tanggal 4
  let d = new Date(year, month - 1, 4);
  // Dapatkan day (Minggu=0, set jadi 7)
  let day = d.getDay() || 7;
  // Mundur ke hari Senin terdekat
  d.setDate(d.getDate() - day + 1);
  // Maju ke minggu ke-n
  d.setDate(d.getDate() + 7 * (week - 1));
  return d;
}

/**
 * Mendapatkan minggu ke-berapa dalam suatu bulan
 * (Perhitungan mengikuti logika offset manual)
 */
function getWeek(date) {
  let monthStart = new Date(date);
  // setDate(0) = tanggal 0 = satu hari sebelum tanggal 1
  monthStart.setDate(0);
  let offset = (monthStart.getDay() + 1) % 7 - 1;
  return Math.ceil((date.getDate() + offset) / 7);
}

/**
 * Mendapatkan array 7 tanggal (string) untuk minggu ke-n di (year, month)
 */
function getWeekDates(year, month, week) {
  let d = getMonthWeek(year, month, week);
  let arr = [];
  for (let i = 0; i < 7; i++) {
    arr.push(d.toLocaleDateString()); // Hasil: MM/DD/YYYY (bawaan toLocaleDateString)
    d.setDate(d.getDate() + 1);
  }
  return arr;
}

export const GetPackingA3 = async (req, res) => {
    try {
        const data = await automationDB.packing_a3.findMany({
            orderBy: { id: 'desc' },
            take: 1
        })
        res.status(200).json(serializeBigInt(data))
    } catch (error) {
        console.error('Error fetching GET /packing_a3', error.message)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA3All = async (req, res) => {
    try {
        const data = await automationDB.packing_a3.findMany({
            where: { graph: 'Y' },
            orderBy: { id: 'desc' }
        })
        res.status(200).json({ data })
    } catch (error) {
        console.error('Error fetching GET /packing_a3_all', error.message)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA3Counter = async (req, res) => {
    try {
        const data = await automationDB.packing_a3.findMany({
            orderBy: { id: 'desc' },
            select: {
                counter: true
            },
            take: 7
        })
        res.status(200).json(data.map(d => d.counter))
    } catch (error) {
        console.error('Error fetching GET /packing_a3_counter', error.message)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA3Shift1 = async (req, res) => {
    try {
        const data = await getShiftDataToday(
            automationDB.packing_a3,
            JamListNormalShift1,
            "Y"
        )
        res.status(200).json(data)
    } catch (error) {
        console.error('Error fetching GET /shift1_a3', error.message)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA3Shift2 = async (req, res) => {
    try {
        const data = await getShiftDataToday(
            automationDB.packing_a3,
            JamListNormalShift2,
            'Y'
        )
        res.status(200).json(data)
    } catch (error) {
        console.error('Error fetching GET /shift2_a3', error.message)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA3Shift3 = async (req, res) => {
    try {
        const today = format(new Date())
        const next = moment().add(1, 'days').toDate()

        const d23 = await getShiftDataForDate(
            automationDB.packing_a3,
            ["23.0"],
            today,
            "Y"
        )

        const mapped = d23.map((r) => ({
            jam: '0.23',
            counter: r.counter
        }))

        const dNext = await getShiftDataForDate(
            automationDB.packing_a3,
            JamListNormalShift3,
            format(next),
            "Y"
        )
        res.json(mapped.concat(dNext));
    } catch (error) {
        console.error('Error fetching GET /shift3_a3', error.message)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
// ==== HOURLY & HOURLY BY DATE ====
export const GetPackingA3Hourly = async (req, res) => {
    try {
        const today = new Date()

        const data = await automationDB.packing_a3.findMany({
            where: { tanggal: today, graph: 'Y', jam: {in: Hourly} },
            select: { id: true, counter: true, time: true, jam: true },
            orderBy: { id: 'asc' }
        })
        res.status(200).json(data)
    } catch(error) {
        console.error('Error fetching GET /packing_a3_hourly', error.message)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA3HourlyByDate = async (req, res) => {
    try {
        const dateThis = req.params.date

        const nextDateObj = new Date(dateThis)
        nextDateObj.setDate(nextDateObj.getDate() + 1)
        const nextDate = format(nextDateObj)

        const sqlToday = `
            SELECT id, counter, time, jam
            FROM automation.packing_a3
            WHERE graph = 'Y'
                AND tanggal = '${dateThis}'
                AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
            ORDER BY id ASC
        `
        const todayRows = await raw(sqlToday)

        const sqlNext = `
            SELECT id, counter, time, jam
            FROM automation.packing_a3
            WHERE graph = 'Y'
                AND tanggal = '${nextDate}'
                AND jam IN (${HourlyNextDay.filter(j => j < 7).map(j => `'${j}'`).join(",")})
            ORDER BY id ASC
        `
        const nextRows = await raw(sqlNext)
        res.send(todayRows.concat(nextRows))
    } catch (error) {
        console.error('Error fetching GET /packing_a3_hourly/date/:date', error.message)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
// ==== DAILY & WEEKLY ====
export const GetPackingA3Daily = async (req, res) => {
    try {
        const today = new Date()
        const data = await automationDB.packing_a3.findMany({
            where: { tanggal: today, graph: 'Y', jam: { in: ['14.58','22.58'] } },
            select: { id: true, counter: true, jam: true },
            orderBy: { id: 'asc' }
        })
        res.status(200).json(data)
    } catch (error) {
        console.error('Error fetching GET /packing_a3_daily', error.message)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA3DailyByDate = async (req, res) => {
    try {
        const dateThis = req.params.date
        let next = new Date(dateThis)
        next.setDate(next.getDate() + 1)
        const nextDate = format(next)

        const sqlToday = `
            SELECT id, counter, jam
            FROM automation.packing_a3
            WHERE graph = 'Y'
                AND tanggal = '${dateThis}'
                AND jam IN ('14.58','22.58')
            ORDER BY id ASC
        `
        const todayRows = await raw(sqlToday)
        const sqlNext = `
            SELECT id, counter, jam
            FROM automation.packing_a3
            WHERE graph = 'Y'
                AND tanggal = '${nextDate}'
                AND jam IN ('6.59')
            ORDER BY id ASC
        `
        const nextRows = await raw(sqlNext)
        res.send(todayRows.concat(nextRows))
    } catch (error) {
        console.error('Error fetching GET /packing_a3_daily/date/:date', error.message)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA3Weekly = async (req, res) => {
    try {
        const dateNow = new Date();
        const year = dateNow.getFullYear();
        const month = String(dateNow.getMonth() + 1).padStart(2);
        const weekIndex = getWeek(dateNow);

        const dates = getWeekDates(year, month, weekIndex);
        const start = new Date(dates[0]);
        const end = new Date(dates[6]);

        const sql = `
            SELECT id, counter, jam, realdatetime
            FROM automation.packing_a3
            WHERE graph = 'Y'
                AND tanggal BETWEEN '${start}' AND '${end}'
                AND jam IN ('14.58','22.58','6.59')
            ORDER BY id ASC
        `
        const rows = await raw(sql)
        res.json(rows);
    } catch (error) {
        console.error('Error in GET /packing_a3_weekly:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA3WeeklyByDate = async (req, res) => {
    try {
        const weekNum = req.params.date;
        const dateNow = new Date();
        const year = dateNow.getFullYear();
        const month = String(dateNow.getMonth() + 1).padStart(2)

        const dates = getWeekDates(year, month, weekNum);
        const startDate = new Date(dates[0]);
        const endDate = new Date(dates[6]);

        const sql = `
            SELECT id, counter, jam, realdatetime
            FROM automation.packing_a3
            WHERE graph = 'Y'
                AND tanggal BETWEEN '${startDate}' AND '${endDate}'
                AND jam IN ('14.58','22.58','6.59')
            ORDER BY id ASC
        `
        const rows = await raw(sql)
        res.json(rows);
    } catch (error) {
        console.error('Error in GET /packing_a3_weekly/date/:date:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}