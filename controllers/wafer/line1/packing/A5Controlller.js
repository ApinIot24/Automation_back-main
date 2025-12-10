import { getShiftDataToday, getShiftDataForDate } from "../../../../config/shiftHelper.js"
import { rawIot as raw, serializeBigInt } from "../../../../config/sqlRaw.js"
import { 
    Hourly, HourlyNextDay,
    JamListNormalShift1,
    JamListNormalShift2,
    JamListNormalShift3
} from "../../../../src/constant/jamShift.js"
import { iotDB } from "../../../../src/db/iot.js"
import moment from "moment"

function format(date) {
    if (!(date instanceof Date) || isNaN(date)) throw new Error("Invalid date")
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

function getMonthWeek(year, month, week) {
    let d = new Date(year, month - 1, 4)
    let day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1)
    d.setDate(d.getDate() + 7 * (week - 1))
    return d
}

function getWeek(date) {
    let monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    let offset = (monthStart.getDay() + 6) % 7
    return Math.ceil((date.getDate() + offset) / 7)
}

function getWeekDates(year, month, week) {
    const start = getMonthWeek(year, month, week)
    const arr = []
    let d = new Date(start)
    for (let i = 0; i < 7; i++) {
        arr.push(new Date(d))
        d.setDate(d.getDate() + 1)
    }
    return arr
}

export const GetPackingA5 = async (req, res) => {
    try {
        const data = await iotDB.packing_a5.findMany({
            orderBy: { id: "desc" },
            take: 1
        })
        res.json(serializeBigInt(data))
    } catch (error) {
        console.error("Error in GET /packing_a5:", error.message)
        res.status(500).json({ error: error.message })
    }
}
export const GetPackingA5All = async (req, res) => {
    try {
        const data = await iotDB.packing_a5.findMany({
            where: { graph: "Y" },
            orderBy: { id: "desc" }
        })
        res.json(serializeBigInt(data))
    } catch (error) {
        console.error("Error in GET /packing_a5_all:", error.message)
        res.status(500).json({ error: error.message })
    }
}
export const GetPackingA5Counter = async (req, res) => {
    try {
        const data = await iotDB.packing_a5.findMany({
            where: { graph: "Y" },
            orderBy: { id: "desc" },
            take: 7
        })
        res.json(serializeBigInt(data.map(x => x.counter)))
    } catch (error) {
        console.error("Error in GET /packing_a5_counter:", error.message)
        res.status(500).json({ error: error.message })
    }
}
// ==== SHIFT ====
export const GetPackingA5Shift1 = async (req, res) => {
    try {
        const data = await getShiftDataToday(
            iotDB.packing_a5,
            JamListNormalShift1,
            "Y"
        )
        res.json(data)
    } catch (error) {
        console.error("Error in GET /shift1_a5:", error.message)
        res.status(500).json({ error: error.message })
    }
}
export const GetPackingA5Shift2 = async (req, res) => {
    try {
        const data = await getShiftDataToday(
            iotDB.packing_a5,
            JamListNormalShift2,
            "Y"
        )
        res.json(data)
    } catch (error) {
        console.error("Error in GET /shift2_a5:", error.message)
        res.status(500).json({ error: error.message })
    }
}
export const GetPackingA5Shift3 = async (req, res) => {
    try {
        const today = format(new Date())
        const next = moment().add(1, "days").toDate()

        const prev = await getShiftDataForDate(
            iotDB.packing_a5,
            ["23.0"],
            today,
            "Y"
        )
        const mapped = prev.map(r => ({ jam: "0.23", counter: r.counter }))

        const nextShift = await getShiftDataForDate(
            iotDB.packing_a5,
            JamListNormalShift3,
            next,
            "Y"
        )

        res.json(serializeBigInt(mapped.concat(nextShift)))
    } catch (error) {
        console.error("Error in GET /shift3_a5:", error.message)
        res.status(500).json({ error: error.message })
    }
}
// ==== HOURLY & with date parameters ====
export const GetPackingA5Hourly = async (req, res) => {
    try {
        const today = new Date()
        const data = await iotDB.packing_a5.findMany({
            where: {
                tanggal: today,
                graph: "Y",
                jam: { in: Hourly }
            },
            orderBy: { id: "asc" }
        })
        res.json(serializeBigInt(data))
    } catch (error) {
        console.error("Error in GET /packing_a5_hourly:", error.message)
        res.status(500).json({ error: error.message })
    }
}
export const GetPackingA5HourlyByDate = async (req, res) => {
    try {
        const dateThis = req.params.date

        // jam utama hari itu
        const todayData = await iotDB.packing_a5.findMany({
            where: {
                tanggal: new Date(dateThis),
                graph: "Y",
                jam: { in: Hourly }
            },
            orderBy: { id: "asc" }
        })

        // next day (01.00–06.59)
        const nextDateObj = new Date(dateThis)
        nextDateObj.setDate(nextDateObj.getDate() + 1)

        const nextData = await iotDB.packing_a5.findMany({
            where: {
                tanggal: nextDateObj,
                graph: "Y",
                jam: { in: HourlyNextDay }
            },
            orderBy: { id: "asc" }
        })

        res.json(serializeBigInt([...todayData, ...nextData]))

    } catch (error) {
        console.error("Error in GET /packing_a5_hourly/date/:date:", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
}
// ==== Daily & Weekly ====
export const GetPackingA5Daily = async (req, res) => {
    try {
        const today = new Date()
        const data = await iotDB.packing_a5.findMany({
            where: {
                tanggal: today,
                graph: "Y",
                jam: { in: ["14.58", "22.58"] }
            },
            select: { id: true, counter: true, jam: true},
            orderBy: { id: "asc" }
        })
        res.json(serializeBigInt(data))
    } catch (error) {
        console.error("Error in GET /packing_a5_daily:", error.message)
        res.status(500).json({ error: error.message })
    }
}
export const GetPackingA5DailyByDate = async (req, res) => {
    try {
        const dateThis = req.params.date

        // data hari ini
        const todayData = await iotDB.packing_a5.findMany({
            where: {
                tanggal: new Date(dateThis),
                graph: "Y",
                jam: { in: ["14.58", "22.58"] }
            },
            orderBy: { id: "asc" }
        })

        const nextDateObj = new Date(dateThis)
        nextDateObj.setDate(nextDateObj.getDate() + 1)

        const nextData = await iotDB.packing_a5.findMany({
            where: {
                tanggal: nextDateObj,
                graph: "Y",
                jam: { in: ["6.59"] }
            },
            select: { id: true, counter: true, jam: true},
            orderBy: { id: "asc" }
        })

        res.send(serializeBigInt(todayData.concat(nextData)))
    } catch (error) {
        console.error("Error in GET /packing_a5_daily/date/:date:", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
}
export const GetPackingA5Weekly = async (req, res) => {
    try {
        const now = new Date()
        const y = now.getFullYear()
        const m = now.getMonth() + 1
        const week = getWeek(now)

        const dates = getWeekDates(y, m, week)
        const start = format(dates[0])
        const end = format(dates[6])

        const rows = await raw(`
            SELECT id, counter, jam, realdatetime
            FROM purwosari.packing_a5
            WHERE graph = 'Y'
            AND tanggal BETWEEN '${start}' AND '${end}'
            AND jam IN ('14.58','22.58','6.59')
            ORDER BY id ASC
        `)

        res.json(serializeBigInt(rows))
    } catch (error) {
        console.error("Error in GET /packing_a5_weekly:", error.message)
        res.status(500).json({ error: error.message })
    }
}
export const GetPackingA5WeeklyByDate = async (req, res) => {
    try {
        const week = Number(req.params.date)
        const now = new Date()
        const y = now.getFullYear()
        const m = now.getMonth() + 1

        const dates = getWeekDates(y, m, week)
        const start = format(dates[0])
        const end = format(dates[6])

        const rows = await raw(`
            SELECT id, counter, jam, realdatetime
            FROM purwosari.packing_a5
            WHERE graph = 'Y'
            AND tanggal BETWEEN '${start}' AND '${end}'
            AND jam IN ('14.58','22.58','6.59')
            ORDER BY id ASC
        `)

        res.json(serializeBigInt(rows))
    } catch (error) {
        console.error("Error in GET /packing_a5_weekly/date/:date:", error.message)
        res.status(500).json({ error: error.message })
    }
}