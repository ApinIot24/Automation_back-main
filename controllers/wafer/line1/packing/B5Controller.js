import { getShiftDataForDate, getShiftDataToday } from "../../../../config/shiftHelper.js";
import { rawIot as raw } from "../../../../config/sqlRaw.js";
import { 
    Hourly, HourlyNextDay,
    JamListNormalShift1,
    JamListNormalShift2,
    JamListNormalShift3
} from "../../../../src/constant/jamShift.js";
import { iotDB } from "../../../../src/db/iot.js";
import moment from "moment";
// ================= HELPER =================
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
    let monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    let offset = (monthStart.getDay() + 6) % 7;
    return Math.ceil((date.getDate() + offset) / 7);
}
function getWeekDates(year, month, week) {
    let d = getMonthWeek(year, month, week);
    let arr = [];
    for (let i = 0; i < 7; i++) {
        arr.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return arr;
}

export const GetPackingB5 = async (req, res) => {
    try {
        const data = await iotDB.packing_b5.findMany({
            orderBy: { id: "desc" },
            take: 1
        });
        res.json(data)
    } catch (error) {
        console.error("Error in GET /packing_b5:", error.message);
        res.status(500).json({ error: error.message });
    }
}
export const GetPackingB5All = async (req, res) => {
    try {
        const data = await iotDB.packing_b5.findMany({
            where: { graph: "Y" },
            orderBy: { id: "desc" }
        });
        res.json(data);
    } catch (error) {
        console.error("Error in GET /packing_b5_all:", error.message);
        res.status(500).json({ error: error.message });
    }
};
export const GetPackingB5Counter = async (req, res) => {
    try {
        const data = await iotDB.packing_b5.findMany({
            where: { graph: "Y" },
            orderBy: { id: "desc" },
            take: 7
        });
        res.json(data.map(x => x.counter));
    } catch (error) {
        console.error("Error in GET /packing_b5_counter:", error.message);
        res.status(500).json({ error: error.message });
    }
}
// ==== SHIFT ====
export const GetPackingB5Shift1 = async (req, res) => {
    try {
        const data = await getShiftDataToday(
            iotDB.packing_b5,
            JamListNormalShift1,
            "Y"
        );
        res.json(data);
    } catch (error) {
        console.error("Error in GET /shift1_b5:", error.message);
        res.status(500).json({ error: error.message });
    }
}
export const GetPackingB5Shift2 = async (req, res) => {
    try {
        const data = await getShiftDataToday(
            iotDB.packing_b5,
            JamListNormalShift2,
            "Y"
        );
        res.json(data);
    } catch (error) {
        console.error("Error in GET /shift2_b5:", error.message);
        res.status(500).json({ error: error.message });
    }
}
export const GetPackingB5Shift3 = async (req, res) => {
    try {
        const today = format(new Date());
        const next = moment().add(1, "days").toDate();

        // jam 23.0 hari ini → treat as next shift start
        const prev = await getShiftDataForDate(
            iotDB.packing_b5,
            ["23.0"],
            today,
            "Y"
        );

        const mapped = prev.map(r => ({
            jam: "0.23",
            counter: r.counter
        }));

        const nextShift = await getShiftDataForDate(
            iotDB.packing_b5,
            JamListNormalShift3,
            next,
            "Y"
        );

        res.json(mapped.concat(nextShift));
    } catch (error) {
        console.error("Error in GET /shift3_b5:", error.message);
        res.status(500).json({ error: error.message });
    }
}
// ==== Hourly & with date parameters ====
export const GetPackingB5Hourly = async (req, res) => {
    try {
        const today = new Date();
        const data = await iotDB.packing_b5.findMany({
            where: { tanggal: today, graph: "Y", jam: { in: Hourly } },
            orderBy: { id: "asc" }
        });
        res.json(data);
    } catch (error) {
        console.error("Error in GET /packing_b5_hourly:", error.message);
        res.status(500).json({ error: error.message });
    }
};
export const GetPackingB5HourlyByDate = async (req, res) => {
    try {
        const dateThis = req.params.date;
        const nextDateObj = new Date(dateThis);
        nextDateObj.setDate(nextDateObj.getDate() + 1);
        const nextDate = format(nextDateObj);

        const todayRows = await iotDB.$queryRawUnsafe(`
            SELECT id, counter, time, jam
            FROM purwosari.packing_b5
            WHERE graph='Y'
            AND tanggal='${dateThis}'
            AND jam IN (${Hourly.map(j => `'${j}'`).join(",")})
            ORDER BY id ASC
        `);

        const nextRows = await iotDB.$queryRawUnsafe(`
            SELECT id, counter, time, jam
            FROM purwosari.packing_b5
            WHERE graph='Y'
            AND tanggal='${nextDate}'
            AND jam IN (${HourlyNextDay.map(j => `'${j}'`).join(",")})
            ORDER BY id ASC
        `);

        res.json(todayRows.concat(nextRows));
    } catch (error) {
        console.error("Error in GET /packing_b5_hourly/date/:date:", error.message);
        res.status(500).json({ error: error.message });
    }
}
// === DAILY & WEEKLY ====
export const GetPackingB5Daily = async (req, res) => {
    try {
        const today = new Date();

        const data = await iotDB.packing_b5.findMany({
            where: {
                tanggal: today,
                graph: "Y",
                jam: { in: ["14.58", "22.58"] }
            },
            orderBy: { id: "asc" }
        });

        res.json(data);
    } catch (error) {
        console.error("Error in GET /packing_b5_daily:", error.message);
        res.status(500).json({ error: error.message });
    }
}
export const GetPackingB5DailyByDate = async (req, res) => {
    try {
        const dateThis = req.params.date;
        const nextDateObj = new Date(dateThis);
        nextDateObj.setDate(nextDateObj.getDate() + 1);
        const nextDate = format(nextDateObj);

        const todayRows = await iotDB.$queryRawUnsafe(`
            SELECT id, counter, jam
            FROM purwosari.packing_b5
            WHERE graph='Y'
            AND tanggal='${dateThis}'
            AND jam IN ('14.58','22.58')
            ORDER BY id ASC
        `);

        const nextRows = await iotDB.$queryRawUnsafe(`
            SELECT id, counter, jam
            FROM purwosari.packing_b5
            WHERE graph='Y'
            AND tanggal='${nextDate}'
            AND jam IN ('6.59')
            ORDER BY id ASC
        `);

        res.send(todayRows.concat(nextRows));
    } catch (error) {
        console.error("Error in GET /packing_b5_daily/date/:date:", error.message);
        res.status(500).json({ error: error.message });
    }
}
export const GetPackingB5Weekly = async (req, res) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const week = getWeek(now);

        const dates = getWeekDates(year, month, week);
        const start = format(dates[0]);
        const end = format(dates[6]);

        const rows = await raw(`
            SELECT id, counter, jam, realdatetime
            FROM purwosari.packing_b5
            WHERE graph='Y'
            AND tanggal BETWEEN '${start}' AND '${end}'
            AND jam IN ('14.58','22.58','6.59')
            ORDER BY id ASC
        `);

        res.json(rows);
    } catch (error) {
        console.error("Error in GET /packing_b5_weekly:", error.message);
        res.status(500).json({ error: error.message });
    }
}
export const GetPackingB5WeeklyByDate = async (req, res) => {
    try {
        const weekNum = Number(req.params.date);
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const dates = getWeekDates(year, month, weekNum);
        const start = format(dates[0]);
        const end = format(dates[6]);

        const rows = await raw(`
            SELECT id, counter, jam, realdatetime
            FROM purwosari.packing_b5
            WHERE graph='Y'
            AND tanggal BETWEEN '${start}' AND '${end}'
            AND jam IN ('14.58','22.58','6.59')
            ORDER BY id ASC
        `);

        res.json(rows);
    } catch (error) {
        console.error("Error in GET /packing_b5_weekly/date/:date:", error.message);
        res.status(500).json({ error: error.message });
    }
}