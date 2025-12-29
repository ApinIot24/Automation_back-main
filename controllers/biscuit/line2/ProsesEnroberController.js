import { iotDB } from "../../../src/db/iot.js";

// Helper function to get shift time range based on shift number and date
const getShiftTimeRange = (shift, date = new Date()) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isSaturday = dayOfWeek === 6;
    const isNormal = !isSaturday; // Senin-Jumat = normal, Sabtu = short shift

    let startTime, endTime;

    if (shift === 1) {
        if (isNormal) {
            // Normal shift 1: 6.47 - 14.45
            startTime = "6.47";
            endTime = "14.45";
        } else {
            // Short shift 1 Saturday: 7.45 - 11.45
            startTime = "7.45";
            endTime = "11.45";
        }
    } else if (shift === 2) {
        if (isNormal) {
            // Normal shift 2: 14.46 - 22.45
            startTime = "14.46";
            endTime = "22.45";
        } else {
            // Short shift 2 Saturday: 12.45 - 16.45
            startTime = "12.45";
            endTime = "16.45";
        }
    } else if (shift === 3) {
        if (isNormal) {
            // Normal shift 3: 0.30 - 6.59 (next day)
            startTime = "0.30";
            endTime = "6.59";
        } else {
            // Short shift 3 Saturday: 17.45 - 21.45
            startTime = "17.45";
            endTime = "21.45";
        }
    } else {
        throw new Error('Invalid shift number. Must be 1, 2, or 3');
    }

    // Convert time string (e.g., "6.47") to Date object
    const parseTime = (timeStr, baseDate) => {
        const [hours, minutes] = timeStr.split('.').map(Number);
        const date = new Date(baseDate);
        date.setHours(hours, minutes || 0, 0, 0);
        return date;
    };

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const start = parseTime(startTime, startDate);

    let end;
    if (shift === 3 && isNormal) {
        // Shift 3 normal spans to next day
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        end = parseTime(endTime, nextDay);
    } else {
        end = parseTime(endTime, startDate);
    }

    return { start, end };
};

// Endpoint - filter by date (query parameter) - menampilkan 3 shift
export const getProsesEnroberByDate = async (req, res) => {
    try {
        const { date } = req.query;
        
        // Parse date if provided, otherwise use today
        let targetDate = new Date();
        if (date) {
            targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) {
                return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
            }
        }

        // Format date to YYYY-MM-DD
        const dateStr = targetDate.toISOString().split('T')[0];

        // Get data for all shifts (1, 2, 3)
        const allShifts = [];
        
        for (let shift = 1; shift <= 3; shift++) {
            const { start, end } = getShiftTimeRange(shift, targetDate);
            
            const shiftRows = await iotDB.malkist_coklat.findMany({
                where: {
                    realdatetime: { gte: start, lte: end }
                },
                orderBy: { realdatetime: 'asc' }
            });
            
            allShifts.push({
                shift: shift,
                totalRecords: shiftRows.length,
                data: shiftRows
            });
        }

        // Calculate total records across all shifts
        const totalRecords = allShifts.reduce((sum, s) => sum + s.totalRecords, 0);

        res.status(200).json({
            date: dateStr,
            totalRecords: totalRecords,
            shifts: allShifts
        });
    } catch (error) {
        console.error("Error in GET /proses_enrober/date:", error.message);
        res.status(500).json({ error: error.message });
    }
};