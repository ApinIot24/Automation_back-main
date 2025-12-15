import moment from "moment";
import { Hourly, HourlyNextDay, JamListNormalShift1, JamListNormalShift2, JamListNormalShift3 } from "../src/constant/jamShift.js";
import { automationDB } from "../src/db/automation.js"
import { format, getWeek, getWeekDates } from "../config/dateUtils.js";

// ==== BASIC CENKIT L2 ====
export const getCenkitL2 = async (req, res) => {
    try {
        const result = await automationDB.cenkit_l2.findMany({
            orderBy: { id: 'desc' },
            take: 1
        })

        res.status(200).send(result);
    } catch (error) {
        console.error('Error in GET /cenkit_l2', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}
export const getCenkitL2All = async (req, res) => {
    try {
        const result = await automationDB.cenkit_l2.findMany({
            where: { graph: 'Y' },
            orderBy: { id: 'desc' }
        })
        res.status(200).send(result);
    } catch (error) {
        console.error('Error in GET /cenkit_l2_all', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}
// ==== SHIFT CENKIT L2 ====
export const getShift1CenkitL2 = async (req, res) => {
    try {
        const today = new Date()
        const result = await automationDB.cenkit_l2.findMany({
            where: { 
                graph: 'Y', 
                tanggal: today, 
                jam: { in: 
                    // [
                    //     '7.0','7.31','8.0','8.31','9.0','9.31',
                    //     '10.0','10.31','11.0','11.31',
                    //     '12.0','12.31','13.0','13.31',
                    //     '14.0','14.31','14.58'
                    // ]
                    JamListNormalShift1
                }
            },
            select: {
                cntr_mixing: true,
                temp_water: true,
                temp_cooling: true,
                jam: true
            },
            orderBy: { id: 'asc' }
        })

        res.status(200).send(result);
    } catch (error) {
        console.error('Error in GET /shift1_cenkit_l2', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
export const getShift2CenkitL2 = async (req, res) => {
    try {
        const today = new Date()
        const result = await automationDB.cenkit_l2.findMany({
            where: { graph: "Y", tanggal: today, 
                jam: {
                    in: 
                    // [
                    //     '15.0','15.31','16.0','16.31','17.0','17.31',
                    //     '18.0','18.31','19.0','19.31',
                    //     '20.0','20.31','21.0','21.31',
                    //     '22.0','22.31','22.58'
                    // ]
                    JamListNormalShift2
                }
            },
            select: {
                cntr_mixing: true,
                temp_cooling: true,
                temp_water: true,
                jam: true
            },
            orderBy: { id: 'asc' }
        })

        res.status(200).send(result)
    } catch (error) {
        console.error('Error in GET /shift2_cenkit_l2', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}
export const getShift3CenkitL2 = async (req, res) => {
    try {
        const today = new Date();
        const next = moment().add(1, "day")

        const d23 = await automationDB.cenkit_l2.findMany({
            where: { graph: 'Y', tanggal: today, jam: '23.0' },
            select: { cntr_mixing: true, temp_water: true, temp_cooling: true, jam: true },
            orderBy: { id: 'asc' }
        })

        const mapped = d23.map(r => ({
        jam: "0.23",
        cntr_mixing: r.cntr_mixing,
        temp_water: r.temp_water,
        temp_cooling: r.temp_cooling
        }));

        const nextRows = await automationDB.cenkit_l2.findMany({
            where: { graph: 'Y', tanggal: next, jam: { in: JamListNormalShift3 } },
            select: { cntr_mixing: true, temp_water: true, temp_cooling: true, jam: true },
            orderBy: { id: 'asc' }
        })

        res.send(mapped.concat(nextRows));
    } catch (error) {
        console.error('Error in GET /shift3_cenkit_l2', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}
// ==== HOURLY & By DATE ====
export const getHourlyCenkitL2 = async (req, res) => {
    try {
        const today = format(new Date());
        const result = await automationDB.cenkit_l2.findMany({
            where: { graph: 'Y', tanggal: today, jam: { in: [ Hourly ]}},
            select: {
                id: true,
                cntr_mixing: true,
                temp_water: true,
                temp_cooling: true,
                jam: true
            },
            orderBy: { id: 'asc' }
        })
        res.status(200).send(result);
    } catch (error) {
        console.error('Error in GET /cenkit_l2_hourly', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}
export const getHourlyCenkitL2ByDate = async (req, res) => {
    try {
        const datethis = req.params.date;
        
        let nextObj = new Date(datethis);
        nextObj.setDate(nextObj.getDate() + 1);
        const nextDate = format(nextObj);
    
        const todayRows = await automationDB.cenkit_l2.findMany({
            where: { graph: 'Y', tanggal: datethis, jam: { in: Hourly } },
            select: {
                id: true, cntr_mixing: true, temp_water: true, temp_cooling: true, jam: true
            },
            orderBy: { id: 'asc' }
        })
    
        const nextRows = await automationDB.cenkit_l2.findMany({
            where: { graph: 'Y', tanggal: nextDate, jam: { in: HourlyNextDay } },
            select: {
                id: true, cntr_mixing: true, temp_water: true, temp_cooling: true, jam: true
            },
            orderBy: { id: 'asc' }
        })
    
        res.send(todayRows.concat(nextRows));
    } catch (error) {
        console.error('Error in GET /cenkit_l2_hourly/date/:date', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}
// ==== DAILY & WEEKLY ====
export const GetCenkitL2Daily = async (req, res) => {
  try {
    const today = format(new Date());

    const rows = await automationDB.cenkit_l2.findMany({
        where: { graph: 'Y', tanggal: today, jam: { in: ['14.58','22.58'] } },
        select: { id:true, cntr_mixing:true, temp_water:true, temp_cooling:true, jam:true },
        orderBy: { id: 'asc' }
    })

    res.send(rows);
  } catch (error) {
    console.error('Error in GET /cenkit_l2_daily', error.message);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};
export const GetCenkitL2DailyByDate = async (req, res) => {
  const datethis = req.params.date;

  let next = new Date(datethis);
  next.setDate(next.getDate() + 1);
  const nextDate = format(next);

  const todayRows = await automationDB.cenkit_l2.findMany({
    where: { graph: 'Y', tanggal: datethis, jam: { in: ['14.58','22.58'] } },
    select: { id:true, cntr_mixing:true, temp_water:true, temp_cooling:true, jam:true },
    orderBy: { id: 'asc' }
  })

  const nextRows = await automationDB.cenkit_l2.findMany({
    where: { graph: 'Y', tanggal: nextDate, jam: '6.59' },
    select: { id:true, cntr_mixing:true, temp_water:true, temp_cooling:true, jam:true },
    orderBy: { id: 'asc' }
  })

  res.send(todayRows.concat(nextRows));
};
export const GetCenkitL2Weekly = async (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2);
  const weekIndex = getWeek(now);

  const dates = getWeekDates(year, month, weekIndex);
  const start = format(new Date(dates[0]));
  const end = format(new Date(dates[6]));

  const rows = await automationDB.cenkit_l2.findMany({
    where: { graph: "Y", tanggal: { gte: start, lte: end }, jam: { in: ['14.58','22.58','6.59'] } },
    select: { id:true, cntr_mixing:true, temp_water:true, temp_cooling:true, jam:true, realdatetime:true },
    orderBy: { id: 'asc' }
  })
  res.send(rows);
};
export const GetCenkitL2WeeklyByDate = async (req, res) => {
  const weekNum = req.params.date
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2);

  const dates = getWeekDates(year, month, weekNum);
  const start = format(new Date(dates[0]));
  const end = format(new Date(dates[6]));

  const rows = await automationDB.cenkit_l2.findMany({
    where: { graph: "Y", tanggal: { gte: start, lte: end }, jam: { in: ['14.58','22.58','6.59'] } },
    select: { id:true, cntr_mixing:true, temp_water:true, temp_cooling:true, jam:true, realdatetime:true },
    orderBy: { id: 'asc' }
  })
  res.send(rows);
};