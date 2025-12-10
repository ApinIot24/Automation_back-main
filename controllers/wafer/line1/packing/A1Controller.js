import moment from "moment";
import { Hourly, HourlyNextDay, JamListNormalShift1, JamListNormalShift2, JamListNormalShift3 } from "../../../../src/constant/jamShift.js";
import { iotDB } from "../../../../src/db/iot.js";
import { rawIot as raw, serializeBigInt } from "../../../../config/sqlRaw.js";
import { getShiftDataForDate, getShiftDataToday } from "../../../../config/shiftHelper.js";

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
 */
function getWeek(date) {
  let monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  // offset = jumlah hari sebelum minggu "penuh" dimulai
  // Hitungan manual agar sesuai definisi "minggu ke-n" di kebutuhan Anda
  let offset = (monthStart.getDay() + 6) % 7; 
  // Rumus perkiraan minggu
  return Math.ceil((date.getDate() + offset) / 7);
}

/**
 * Mengembalikan array 7 tanggal (string) untuk minggu ke-n di (year, month)
 */
function getWeekDates(year, month, week) {
  let d = getMonthWeek(year, month, week);
  let arr = [];
  for (let i = 0; i < 7; i++) {
    arr.push(format(d));
    d.setDate(d.getDate() + 1);
  }
  return arr;
}

export const GetPackingA1 = async (req, res) => {
    try {
        const data = await iotDB.packing_a1.findMany({
            orderBy: { id: 'desc' },
            take: 1
        })

        if (!data || data.length === 0) {
        return res.status(404).json({ error: 'No data found' });
        }
        res.json(serializeBigInt(data));
    } catch (error) {
        console.error('Error in GET /packing_a1:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA1All = async (req, res) => {
    try {
        const data = await iotDB.packing_a1.findMany({
            where: {
                graph: 'Y'
            },
            orderBy: { id: 'desc' }
        })
        res.json(serializeBigInt(data));
    } catch (error) {
        console.error('Error in GET /packing_a1_all:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA1Counter = async (req, res) => {
    try {
        const data = await iotDB.packing_a1.findMany({
            orderBy: { id: 'desc' },
            take: 7
        })
        res.json(serializeBigInt(data.map((d) => d.counter)));
    } catch (error) {
        console.error('Error in GET /packing_a1_counter:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
// ==== Shift A1 Per SHIFT ====
export const GetPackingA1Shift1 = async (req, res) => {
    try {
        const data = await getShiftDataToday(
            iotDB.packing_a1,
            JamListNormalShift1,
            "Y"
        )
        res.json(data);
    } catch (error) {
        console.error('Error in GET /shift1_a1:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA1Shift2 = async (req, res) => {
    try {
        const thisdaytime = format(new Date());
        const data = await getShiftDataToday(
            iotDB.packing_a1,
            JamListNormalShift2,
            "Y"
        )
        // const result = await req.db_iot.query(`
        // SELECT counter, jam 
        // FROM purwosari.packing_a1 
        // WHERE graph = 'Y' 
        //     AND tanggal = '${thisdaytime}'
        //     AND jam in (
        //     '14.47','15.30','16.00','16.30','17.00','17.30','18.00',
        //     '18.30','19.00','19.30','20.00','20.30','21.00','21.30',
        //     '22.00','22.30','22.45'
        //     ) 
        // ORDER BY id ASC
        // `);
        res.json(data);
    } catch (error) {
        console.error('Error in GET /shift2_a1:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
// (gabungan data jam 22.47 di hari ini + jam 0.30 s/d 6.45 di hari berikutnya)
export const GetPackingA1Shift3 = async (req, res) => {
    try {
        const today = format(new Date())
        const next = moment().add(1, 'days').toDate()

        const d23 = await getShiftDataForDate(
            iotDB.packing_a1,
            ['22.47'],
            today,
            "Y"
        )

        const mapped = d23.map((r) => ({
            jam: '0.23',
            counter: r.counter
        }))

        const dNext = await getShiftDataForDate(
            iotDB.packing_a1,
            JamListNormalShift3,
            next,
            "Y"
        )
        res.json(serializeBigInt(mapped.concat(dNext)));
    } catch (error) {
        console.error('Error in GET /shift3_a1:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
// ==== Hourly & HOURLY BY DATE ====
export const GetPackingA1Hourly = async (req, res) => {
    try {
        const today = new Date()

        const data = await iotDB.packing_a1.findMany({
            where: {
                tanggal: today,
                graph: 'Y',
                jam: { in: Hourly}
            },
            orderBy: { id: 'asc' }
        })

        res.json(serializeBigInt(data));
    } catch (error) {
        console.error('Error in GET /packing_a1_hourly:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA1HourlyByDate = async (req, res) => {
    try {
        const dateThis = req.params.date;

        const nextDateObj = new Date(dateThis);
        nextDateObj.setDate(nextDateObj.getDate() + 1);
        const nextDate = format(nextDateObj);

        const sqlToday = `
            SELECT id, counter, time, jam
            FROM purwosari.packing_a1
            WHERE graph = 'Y'
                AND tanggal = '${dateThis}'
                AND jam in (${Hourly.map(j => `'${j}'`).join(",")})
            ORDER BY id ASC
        `
        const todayRows = await raw(sqlToday);

        const sqlNext = `
            SELECT id, counter, time, jam
            FROM purwosari.packing_a1
            WHERE graph = 'Y'
                AND tanggal = '${nextDate}'
                AND jam in (${HourlyNextDay.map(j => `'${j}'`).join(",")})
            ORDER BY id ASC
        `
        const nextRows = await raw(sqlNext);
        res.send(todayRows.concat(nextRows));
    } catch (error) {
        console.error('Error in GET /packing_a1_hourly/date/:date:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
// ==== daily & weekly ====
export const GetPackingA1Daily = async (req, res) => {
    try {
        const today = new Date()
        const data = await iotDB.packing_a1.findMany({
            where: { tanggal: today, graph: 'Y', jam: { in: ['14.58','22.58'] } },
            select: { id: true, counter: true, jam: true },
            orderBy: { id: 'asc' }
        })
        res.json(data);
    } catch (error) {
        console.error('Error in GET /packing_a1_daily:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA1DailyByDate = async (req, res) => {
    try {
        const dateThis = req.params.date;

        let next = new Date(dateThis);
        next.setDate(next.getDate() + 1);
        const nextDate = format(next);

        const sqlToday = `
            SELECT id, counter, jam
            FROM purwosari.packing_a1
            WHERE graph = 'Y'
                AND tanggal = '${dateThis}'
                AND jam in ('14.58','22.58')
            ORDER BY id ASC
        `
        const todayRows = await raw(sqlToday);

        const sqlNext = `
            SELECT id, counter, jam
            FROM purwosari.packing_a1
            WHERE graph = 'Y'
                AND tanggal = '${nextDate}'
                AND jam in ('6.59')
            ORDER BY id ASC
        `
        const nextRows = await raw(sqlNext);

        res.json(todayRows.concat(nextRows));
    } catch (error) {
        console.error('Error in GET /packing_a1_daily/date/:date:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA1Weekly = async (req, res) => {
    try {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2)
        const weekIndex = getWeek(now)

        const dates = getWeekDates(year, month, weekIndex)

        const start = format(new Date(dates[0]))
        const end = format(new Date(dates[6]))
    
        const sql = `
            SELECT id, counter, jam, realdatetime
            FROM purwosari.packing_a1
            WHERE graph = 'Y'
                AND tanggal BETWEEN '${start}' AND '${end}'
                AND jam in ('14.58','22.58','6.59')
            ORDER BY id ASC
        `

        const rows = await raw(sql);
        res.json(rows);
    } catch (error) {
        console.error('Error in GET /packing_a1_weekly:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const GetPackingA1WeeklyByDate = async (req, res) => {
    try {
        const weekNum = Number(req.params.date);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2);

        const dates = getWeekDates(year, month, weekNum);

        const startdate = format(new Date(dates[0]));
        const enddate = format(new Date(dates[6]));

        const sql = `
            SELECT id, counter, jam, realdatetime
        FROM purwosari.packing_a1
        WHERE graph = 'Y'
            AND tanggal BETWEEN '${startdate}' AND '${enddate}'
            AND jam in ('14.58','22.58','6.59')
        ORDER BY id ASC
        `

        const rows = await raw(sql)
        res.json(rows)
    } catch (error) {
        console.error('Error in GET /packing_a1_weekly/date/:date:', error.message)
        res.status(500).json({ error: 'Internal Server Error' });
    }
}