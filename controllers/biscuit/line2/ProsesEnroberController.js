import { iotDB } from "../../../src/db/iot.js";
import { serializeDatesToWIB } from "../../../config/timezoneUtils.js";

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
    const parseTime = (timeStr, baseDate, isEndTime = false) => {
        const [hours, minutes] = timeStr.split('.').map(Number);
        const date = new Date(baseDate);
        if (isEndTime) {
            // For end time, set to end of that minute (e.g., 14.45 -> 14:45:59.999)
            date.setHours(hours, minutes || 0, 59, 999);
        } else {
            // For start time, set to beginning of that minute (e.g., 6.47 -> 06:47:00.000)
            date.setHours(hours, minutes || 0, 0, 0);
        }
        return date;
    };

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const start = parseTime(startTime, startDate, false);

    let end;
    if (shift === 3 && isNormal) {
        // Shift 3 normal spans to next day
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        end = parseTime(endTime, nextDay, true);
    } else {
        end = parseTime(endTime, startDate, true);
    }

    return { start, end };
};

// Helper function to determine shift from realdatetime
const getShiftFromDateTime = (realdatetime, targetDate) => {
    if (!realdatetime) return null;
    
    const dt = new Date(realdatetime);
    const date = targetDate || new Date();
    
    // Get date part of realdatetime for comparison
    const dtDate = new Date(dt);
    dtDate.setHours(0, 0, 0, 0);
    const targetDateOnly = new Date(date);
    targetDateOnly.setHours(0, 0, 0, 0);
    
    const prevDay = new Date(targetDateOnly);
    prevDay.setDate(prevDay.getDate() - 1);
    const isPrevDay = dtDate.getTime() === prevDay.getTime();
    const isSameDay = dtDate.getTime() === targetDateOnly.getTime();
    
    // First, ALWAYS check shift 1 and 2 on target date first (these don't span days)
    // This ensures data like 14:45 goes to shift 1, not shift 3
    for (let shift = 1; shift <= 2; shift++) {
        const { start, end } = getShiftTimeRange(shift, date);
        if (dt >= start && dt <= end) {
            return shift;
        }
    }
    
    // Then check shift 3 from previous day (00:30 - 06:59 of target date)
    // This is ONLY for data that is on previous day OR same day but before 07:00
    if (isPrevDay) {
        const { start, end } = getShiftTimeRange(3, prevDay);
        if (dt >= start && dt <= end) {
            return 3;
        }
    } else if (isSameDay) {
        // For same day, only check shift 3 if hour is before 7 (00:30 - 06:59)
        const hour = dt.getHours();
        const minute = dt.getMinutes();
        if (hour < 7 || (hour === 6 && minute <= 59)) {
            const { start, end } = getShiftTimeRange(3, prevDay);
            if (dt >= start && dt <= end) {
                return 3;
            }
        }
    }
    
    // Finally, check shift 3 on target date (ONLY for Saturday short shift)
    // Only check if it's Saturday and data is on same day
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 6 && isSameDay) {
        const { start, end } = getShiftTimeRange(3, date);
        // For Saturday, shift 3 is 17:45 - 21:45, so check if within range
        if (dt >= start && dt <= end) {
            return 3;
        }
    }
    
    return null;
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

        // Query all data for the date (similar to CentralKitchen1Controller)
        const rows = await iotDB.$queryRawUnsafe(
            `
            SELECT 
                id,
                realdatetime,
                temp_coklat,
                water_temp1,
                water_temp2,
                room_heater,
                temp_zone12,
                temp_zone34,
                temp_zone56,
                speed
            FROM purwosari.malkist_coklat
            WHERE DATE(realdatetime) = $1
            ORDER BY realdatetime ASC
            `,
            dateStr
        );

        if (!rows || rows.length === 0) {
            return res.status(200).json({
                date: dateStr,
                totalRecords: 0,
                shifts: [
                    { shift: 1, totalRecords: 0, data: [] },
                    { shift: 2, totalRecords: 0, data: [] },
                    { shift: 3, totalRecords: 0, data: [] }
                ]
            });
        }

        // Group by shift first
        const byShift = new Map(); // key: shift (1,2,3) -> row[]
        
        for (const r of rows) {
            const shift = getShiftFromDateTime(r.realdatetime, targetDate);
            if (!shift) continue; // Skip if cannot determine shift
            
            if (!byShift.has(shift)) {
                byShift.set(shift, []);
            }
            byShift.get(shift).push(r);
        }

        // Process each shift - get hourly data (one record per hour)
        const shiftResults = [];
        const shiftKeys = [1, 2, 3]; // Order: shift 1, 2, 3

        for (const shift of shiftKeys) {
            if (!byShift.has(shift)) {
                shiftResults.push({
                    shift: shift,
                    totalRecords: 0,
                    data: []
                });
                continue;
            }

            const shiftRows = byShift.get(shift);
            
            // Group by hour and get one record per hour (latest in that hour)
            const hourlyMap = new Map(); // key: hour string -> row
            
            for (const row of shiftRows) {
                const hour = new Date(row.realdatetime);
                hour.setMinutes(0, 0, 0);
                const hourKey = hour.toISOString();
                
                if (!hourlyMap.has(hourKey)) {
                    hourlyMap.set(hourKey, row);
                } else {
                    // Keep the latest record in this hour
                    const existing = hourlyMap.get(hourKey);
                    if (new Date(row.realdatetime) > new Date(existing.realdatetime)) {
                        hourlyMap.set(hourKey, row);
                    }
                }
            }
            
            // Convert map to array and sort by realdatetime
            // Convert realdatetime to WIB timezone
            const hourlyData = Array.from(hourlyMap.values())
                .sort((a, b) => new Date(a.realdatetime) - new Date(b.realdatetime))
                .map(row => serializeDatesToWIB(row, ['realdatetime']));

            shiftResults.push({
                shift: shift,
                totalRecords: hourlyData.length,
                data: hourlyData
            });
        }

        // Calculate total records across all shifts
        const totalRecords = shiftResults.reduce((sum, s) => sum + s.totalRecords, 0);

        res.status(200).json({
            date: dateStr,
            totalRecords: totalRecords,
            shifts: shiftResults
        });
    } catch (error) {
        console.error("Error in GET /proses_enrober/date:", error.message);
        res.status(500).json({ error: error.message });
    }
};