import { iotDB } from "../src/db/iot.js";
import { format, getWeekDates } from "../config/dateUtils.js";

const WHERE_L1 = { line: 'L1' };
const SELECT_FIELDS = {
    id: true,
    ck_mixing: true,
    temp_water: true,
    ck_temp_cooling: true,
    ck_status: true,
    timing_mixing: true,
    weight_mixing: true,
    realdatetime: true
};

// Helper function untuk mendapatkan range waktu shift
const getShiftTimeRange = (shift) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();
    
    switch(shift) {
        case 1:
            // Shift 1: 07:00 - 15:00
            return {
                start: new Date(year, month, date, 7, 0, 0),
                end: new Date(year, month, date, 15, 0, 0)
            };
        case 2:
            // Shift 2: 15:00 - 23:00
            return {
                start: new Date(year, month, date, 15, 0, 0),
                end: new Date(year, month, date, 23, 0, 0)
            };
        case 3:
            // Shift 3: 23:00 hari ini - 07:00 besok
            const tomorrow = new Date(year, month, date + 1);
            return {
                start: new Date(year, month, date, 23, 0, 0),
                end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 7, 0, 0)
            };
        default:
            return null;
    }
};

// ==== BASIC CENKIT L1 ====
export const getCenkitL1 = async (req, res) => {
    try {
        const result = await iotDB.ck_wafer_status.findMany({
            where: WHERE_L1,
            orderBy: { id: 'desc' },
            take: 1
        })

        res.status(200).send(result);
    } catch (error) {
        console.error('Error in GET /cenkit_l1', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

// ==== SHIFT CENKIT L1 ====
export const getShiftCenkitL1 = async (req, res) => {
    try {
        const shift = parseInt(req.params.shift);
        if (![1, 2, 3].includes(shift)) {
            return res.status(400).send({ error: 'Invalid shift. Must be 1, 2, or 3' });
        }
        
        const timeRange = getShiftTimeRange(shift);
        const result = await iotDB.ck_wafer_status.findMany({
            where: {
                ...WHERE_L1,
                realdatetime: {
                    gte: timeRange.start,
                    lte: timeRange.end
                }
            },
            select: SELECT_FIELDS,
            orderBy: { realdatetime: 'asc' }
        })

        res.status(200).send(result);
    } catch (error) {
        console.error(`Error in GET /shift${req.params.shift}_cenkit_l1`, error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

// Backward compatibility
export const getShift1CenkitL1 = async (req, res) => {
    req.params.shift = '1';
    return getShiftCenkitL1(req, res);
}

export const getShift2CenkitL1 = async (req, res) => {
    req.params.shift = '2';
    return getShiftCenkitL1(req, res);
}

export const getShift3CenkitL1 = async (req, res) => {
    req.params.shift = '3';
    return getShiftCenkitL1(req, res);
}

// ==== HOURLY & By DATE ====
export const getHourlyCenkitL1ByDate = async (req, res) => {
    try {
        const dateParam = req.params.date;
        const dateObj = new Date(dateParam);
        const nextDateObj = new Date(dateObj);
        nextDateObj.setDate(nextDateObj.getDate() + 1);
        
        // Filter untuk jam-jam tertentu (hourly: setiap jam)
        const startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0);
        const endDate = new Date(nextDateObj.getFullYear(), nextDateObj.getMonth(), nextDateObj.getDate(), 0, 0, 0);
        
        const result = await iotDB.ck_wafer_status.findMany({
            where: {
                ...WHERE_L1,
                realdatetime: {
                    gte: startDate,
                    lt: endDate
                }
            },
            select: SELECT_FIELDS,
            orderBy: { realdatetime: 'asc' }
        })
    
        res.status(200).send(result);
    } catch (error) {
        console.error('Error in GET /cenkit_l1_hourly/date/:date', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

// ==== DAILY & WEEKLY ====
export const GetCenkitL1DailyByDate = async (req, res) => {
  try {
    const dateParam = req.params.date;
    const dateObj = new Date(dateParam);
    
    // Filter untuk tanggal tertentu (seluruh hari)
    const startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0);
    const endDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59);

    const rows = await iotDB.ck_wafer_status.findMany({
        where: {
            ...WHERE_L1,
            realdatetime: {
                gte: startDate,
                lte: endDate
            }
        },
        select: SELECT_FIELDS,
        orderBy: { realdatetime: 'asc' }
    })

    res.status(200).send(rows);
  } catch (error) {
    console.error('Error in GET /cenkit_l1_daily/date/:date', error.message);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

export const GetCenkitL1WeeklyByDate = async (req, res) => {
  try {
    const weekNum = parseInt(req.params.date);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const dates = getWeekDates(year, month, weekNum);
    const start = format(new Date(dates[0]));
    const end = format(new Date(dates[6]));

    // Convert to Date objects for DateTime comparison
    const startDate = new Date(start + 'T00:00:00.000Z');
    const endDate = new Date(end + 'T23:59:59.999Z');

    const rows = await iotDB.ck_wafer_status.findMany({
        where: {
            ...WHERE_L1,
            realdatetime: {
                gte: startDate,
                lte: endDate
            }
        },
        select: SELECT_FIELDS,
        orderBy: { realdatetime: 'asc' }
    })
    
    res.status(200).send(rows);
  } catch (error) {
    console.error('Error in GET /cenkit_l1_weekly/date/:date', error.message);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

// ==== SHIFT END (Jam Terakhir) ====
// Helper function untuk mendapatkan data berdasarkan jam tertentu
const getShiftEndByHour = async (hour, minute, date = null) => {
    const targetDate = date ? new Date(date) : new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();
    
    // Buat range waktu untuk jam tertentu (dengan toleransi beberapa menit)
    const startTime = new Date(year, month, day, hour, minute - 5, 0); // 5 menit sebelum
    const endTime = new Date(year, month, day, hour, minute + 5, 59); // 5 menit setelah
    
    return await iotDB.ck_wafer_status.findMany({
        where: {
            ...WHERE_L1,
            realdatetime: {
                gte: startTime,
                lte: endTime
            }
        },
        select: SELECT_FIELDS,
        orderBy: { realdatetime: 'desc' },
        take: 1 // Ambil yang terakhir
    });
};

// Shift end time mapping
const SHIFT_END_TIMES = {
    1: { hour: 14, minute: 45 },
    2: { hour: 22, minute: 45 },
    3: { hour: 6, minute: 45 }
};

export const getShiftEndCenkitL1 = async (req, res) => {
    try {
        const shift = parseInt(req.params.shift);
        if (![1, 2, 3].includes(shift)) {
            return res.status(400).send({ error: 'Invalid shift. Must be 1, 2, or 3' });
        }
        
        const { hour, minute } = SHIFT_END_TIMES[shift];
        const today = new Date();
        const result = await getShiftEndByHour(hour, minute, today);
        
        res.status(200).send(result);
    } catch (error) {
        console.error(`Error in GET /shift${req.params.shift}_end_cenkit_l1`, error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

// Backward compatibility
export const getShift1EndCenkitL1 = async (req, res) => {
    req.params.shift = '1';
    return getShiftEndCenkitL1(req, res);
}

export const getShift2EndCenkitL1 = async (req, res) => {
    req.params.shift = '2';
    return getShiftEndCenkitL1(req, res);
}

export const getShift3EndCenkitL1 = async (req, res) => {
    req.params.shift = '3';
    return getShiftEndCenkitL1(req, res);
}