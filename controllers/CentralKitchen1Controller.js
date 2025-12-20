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

// Helper function untuk menentukan apakah hari Sabtu
const isSaturday = (date) => {
    return date.getDay() === 6; // 6 = Sabtu
};

// Helper function untuk mendapatkan range waktu shift
// Sabtu: 5 jam per shift, Senin-Jumat: 8 jam per shift
const getShiftTimeRange = (shift, date = null) => {
    const targetDate = date ? new Date(date) : new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();
    const isSat = isSaturday(targetDate);
    
    if (isSat) {
        // Sabtu: Shift 5 jam mulai jam 7
        switch(shift) {
            case 1:
                // Shift 1: 07:00 - 12:00 (5 jam)
                return {
                    start: new Date(year, month, day, 7, 0, 0),
                    end: new Date(year, month, day, 12, 0, 0)
                };
            case 2:
                // Shift 2: 12:00 - 17:00 (5 jam)
                return {
                    start: new Date(year, month, day, 12, 0, 0),
                    end: new Date(year, month, day, 17, 0, 0)
                };
            case 3:
                // Shift 3: 17:00 - 22:00 (5 jam)
                return {
                    start: new Date(year, month, day, 17, 0, 0),
                    end: new Date(year, month, day, 22, 0, 0)
                };
            default:
                return null;
        }
    } else {
        // Senin-Jumat: Shift 8 jam mulai jam 7
    switch(shift) {
        case 1:
                // Shift 1: 07:00 - 15:00 (8 jam)
            return {
                    start: new Date(year, month, day, 7, 0, 0),
                    end: new Date(year, month, day, 15, 0, 0)
            };
        case 2:
                // Shift 2: 15:00 - 23:00 (8 jam)
            return {
                    start: new Date(year, month, day, 15, 0, 0),
                    end: new Date(year, month, day, 23, 0, 0)
            };
        case 3:
                // Shift 3: 23:00 hari ini - 07:00 besok (8 jam)
                const tomorrow = new Date(year, month, day + 1);
            return {
                    start: new Date(year, month, day, 23, 0, 0),
                end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 7, 0, 0)
            };
        default:
            return null;
        }
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
        
        // Support optional date parameter
        const dateParam = req.query.date || req.params.date;
        const targetDate = dateParam ? new Date(dateParam) : new Date();
        
        const timeRange = getShiftTimeRange(shift, targetDate);
        if (!timeRange) {
            return res.status(400).send({ error: 'Invalid shift time range' });
        }
        
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


// ==== HELPER FUNCTIONS FOR DATA ANALYSIS ====

// Fungsi untuk mendapatkan peak weight_mixing (highest dan lowest bergantian)
// Menggunakan logika similar to getlowerhighdata dari BiscuitCk3Controller
// Threshold dapat disesuaikan berdasarkan kebutuhan aktual data weight_mixing
const getWeightMixingPeaks = (data, minWeightThreshold = 50) => {
    // Default threshold 50, dapat disesuaikan berdasarkan karakteristik data aktual
    
    let groupedData = [];
    let currentGroup = [];
    
    // Pengelompokan data berdasarkan kriteria
    for (const current of data) {
        if (!current.weight_mixing || current.weight_mixing <= 0) continue; // Skip data tidak valid
        
        if (current.weight_mixing >= minWeightThreshold) {
            // Grup tinggi
            if (
                currentGroup.length === 0 ||
                (currentGroup[0].weight_mixing && currentGroup[0].weight_mixing >= minWeightThreshold)
            ) {
                currentGroup.push(current);
            } else {
                groupedData.push(currentGroup);
                currentGroup = [current]; // Mulai grup baru
            }
        } else if (current.weight_mixing < 5) {
            // Grup rendah
            if (
                currentGroup.length === 0 ||
                (currentGroup[0].weight_mixing && currentGroup[0].weight_mixing < 5)
            ) {
                currentGroup.push(current);
            } else {
                groupedData.push(currentGroup);
                currentGroup = [current]; // Mulai grup baru
            }
        }
    }
    
    // Tambah grup yang tersisa
    if (currentGroup.length > 0) {
        groupedData.push(currentGroup);
    }
    
    const peaks = [];
    let isTakingHighest = true; // Awali dengan mengambil tertinggi
    
    for (const group of groupedData) {
        if (isTakingHighest) {
            const highest = group.reduce(
                (max, item) => (item.weight_mixing > max.weight_mixing ? item : max),
                group[0]
            );
            peaks.push({ 
                type: "highest", 
                weight_mixing: highest.weight_mixing,
                realdatetime: highest.realdatetime,
                id: highest.id
            });
        } else {
            const lowest = group.reduce(
                (min, item) => (item.weight_mixing < min.weight_mixing ? item : min),
                group[0]
            );
            peaks.push({ 
                type: "lowest", 
                weight_mixing: lowest.weight_mixing,
                realdatetime: lowest.realdatetime,
                id: lowest.id
            });
        }
        isTakingHighest = !isTakingHighest; // Toggle antara mengambil tertinggi dan terendah
    }
    
    // Urutkan peaks berdasarkan realdatetime
    return peaks.sort((a, b) => new Date(a.realdatetime) - new Date(b.realdatetime));
};

// ==== SUMMARY STATISTICS ====
// Endpoint untuk mendapatkan summary statistics sesuai karakteristik setiap kolom
export const getCenkitL1SummaryStats = async (req, res) => {
    try {
        const { shift, date } = req.query;
        let timeRange = null;
        let data = [];
        
        if (shift) {
            // Summary per shift
            const shiftNum = parseInt(shift);
            if (![1, 2, 3].includes(shiftNum)) {
                return res.status(400).send({ error: 'Invalid shift. Must be 1, 2, or 3' });
            }
            const targetDate = date ? new Date(date) : new Date();
            timeRange = getShiftTimeRange(shiftNum, targetDate);
            
            data = await iotDB.ck_wafer_status.findMany({
                where: {
                    ...WHERE_L1,
                    realdatetime: {
                        gte: timeRange.start,
                        lte: timeRange.end
                    }
                },
                select: SELECT_FIELDS,
                orderBy: { realdatetime: 'asc' }
            });
        } else if (date) {
            // Summary per tanggal
            const dateObj = new Date(date);
            const startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0);
            const endDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59);
            
            data = await iotDB.ck_wafer_status.findMany({
                where: {
                    ...WHERE_L1,
                    realdatetime: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: SELECT_FIELDS,
                orderBy: { realdatetime: 'asc' }
            });
        } else {
            // Summary hari ini
            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
            const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            
            data = await iotDB.ck_wafer_status.findMany({
                where: {
                    ...WHERE_L1,
                    realdatetime: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: SELECT_FIELDS,
                orderBy: { realdatetime: 'asc' }
            });
        }
        
        if (data.length === 0) {
            return res.status(200).send({
                message: 'No data found',
                summary: {}
            });
        }
        
        // Filter data numerik yang valid
        const validCkMixing = data.filter(d => d.ck_mixing !== null && d.ck_mixing !== undefined).map(d => d.ck_mixing);
        const validTempWater = data.filter(d => d.temp_water !== null && d.temp_water !== undefined).map(d => d.temp_water);
        const validTempCooling = data.filter(d => d.ck_temp_cooling !== null && d.ck_temp_cooling !== undefined).map(d => d.ck_temp_cooling);
        const validWeightMixing = data.filter(d => d.weight_mixing !== null && d.weight_mixing !== undefined).map(d => d.weight_mixing);
        
        // Hitung statistics untuk ck_mixing (counter per shift)
        const ckMixingStats = validCkMixing.length > 0 ? {
            min: Math.min(...validCkMixing),
            max: Math.max(...validCkMixing),
            avg: validCkMixing.reduce((a, b) => a + b, 0) / validCkMixing.length,
            total: validCkMixing[validCkMixing.length - 1] - validCkMixing[0], // Selisih counter pertama dan terakhir
            first: validCkMixing[0],
            last: validCkMixing[validCkMixing.length - 1],
            count: validCkMixing.length
        } : null;
        
        // Hitung statistics untuk temp_water (suhu per menit)
        const tempWaterStats = validTempWater.length > 0 ? {
            min: Math.min(...validTempWater),
            max: Math.max(...validTempWater),
            avg: validTempWater.reduce((a, b) => a + b, 0) / validTempWater.length,
            count: validTempWater.length
        } : null;
        
        // Hitung statistics untuk ck_temp_cooling (suhu per menit)
        const tempCoolingStats = validTempCooling.length > 0 ? {
            min: Math.min(...validTempCooling),
            max: Math.max(...validTempCooling),
            avg: validTempCooling.reduce((a, b) => a + b, 0) / validTempCooling.length,
            count: validTempCooling.length
        } : null;
        
        // Hitung statistics untuk weight_mixing
        const weightMixingStats = validWeightMixing.length > 0 ? {
            min: Math.min(...validWeightMixing),
            max: Math.max(...validWeightMixing),
            avg: validWeightMixing.reduce((a, b) => a + b, 0) / validWeightMixing.length,
            count: validWeightMixing.length
        } : null;
        
        // Hitung statistics untuk ck_status (boolean per menit)
        const statusData = data.filter(d => d.ck_status !== null && d.ck_status !== undefined);
        const statusStats = statusData.length > 0 ? {
            total: statusData.length,
            active: statusData.filter(d => d.ck_status === true).length,
            inactive: statusData.filter(d => d.ck_status === false).length,
            activePercentage: (statusData.filter(d => d.ck_status === true).length / statusData.length) * 100
        } : null;
        
        res.status(200).send({
            period: shift ? `Shift ${shift}${date ? ` - ${date}` : ''}` : (date || 'Today'),
            totalRecords: data.length,
            summary: {
                ck_mixing: ckMixingStats,
                temp_water: tempWaterStats,
                ck_temp_cooling: tempCoolingStats,
                weight_mixing: weightMixingStats,
                ck_status: statusStats
            }
        });
    } catch (error) {
        console.error('Error in GET /cenkit_l1_summary_stats', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

// ==== WEIGHT MIXING PEAKS ====
// Endpoint untuk mendapatkan peak weight_mixing (highest dan lowest bergantian)
export const getCenkitL1WeightMixingPeaks = async (req, res) => {
    try {
        const { shift, date } = req.query;
        let timeRange = null;
        let data = [];
        
        if (shift) {
            // Peaks per shift
            const shiftNum = parseInt(shift);
            if (![1, 2, 3].includes(shiftNum)) {
                return res.status(400).send({ error: 'Invalid shift. Must be 1, 2, or 3' });
            }
            const targetDate = date ? new Date(date) : new Date();
            timeRange = getShiftTimeRange(shiftNum, targetDate);
            
            data = await iotDB.ck_wafer_status.findMany({
                where: {
                    ...WHERE_L1,
                    realdatetime: {
                        gte: timeRange.start,
                        lte: timeRange.end
                    }
                },
                select: SELECT_FIELDS,
                orderBy: { realdatetime: 'asc' }
            });
        } else if (date) {
            // Peaks per tanggal
            const dateObj = new Date(date);
            const startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0);
            const endDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59);
            
            data = await iotDB.ck_wafer_status.findMany({
                where: {
                    ...WHERE_L1,
                    realdatetime: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: SELECT_FIELDS,
                orderBy: { realdatetime: 'asc' }
            });
        } else {
            // Peaks hari ini
            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
            const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            
            data = await iotDB.ck_wafer_status.findMany({
                where: {
                    ...WHERE_L1,
                    realdatetime: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: SELECT_FIELDS,
                orderBy: { realdatetime: 'asc' }
            });
        }
        
        if (data.length === 0) {
            return res.status(200).send({
                message: 'No data found',
                peaks: []
            });
        }
        
        // Threshold untuk weight_mixing (dapat disesuaikan berdasarkan data aktual)
        // Jika perlu, bisa dijadikan query parameter
        const minWeightThreshold = req.query.minWeightThreshold 
            ? parseFloat(req.query.minWeightThreshold) 
            : 50; // Default 50
        const peaks = getWeightMixingPeaks(data, minWeightThreshold);
        
        res.status(200).send({
            period: shift ? `Shift ${shift}${date ? ` - ${date}` : ''}` : (date || 'Today'),
            totalRecords: data.length,
            peaks: peaks,
            peakCount: peaks.length
        });
    } catch (error) {
        console.error('Error in GET /cenkit_l1_weight_mixing_peaks', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

// ==== TEMPERATURE ANALYSIS (Per Menit) ====
// Endpoint untuk analisis suhu per menit
export const getCenkitL1TemperatureAnalysis = async (req, res) => {
    try {
        const { shift, date, type } = req.query; // type: 'water' atau 'cooling' atau 'both'
        let timeRange = null;
        let data = [];
        
        if (shift) {
            const shiftNum = parseInt(shift);
            if (![1, 2, 3].includes(shiftNum)) {
                return res.status(400).send({ error: 'Invalid shift. Must be 1, 2, or 3' });
            }
            const targetDate = date ? new Date(date) : new Date();
            timeRange = getShiftTimeRange(shiftNum, targetDate);
            
            data = await iotDB.ck_wafer_status.findMany({
                where: {
                    ...WHERE_L1,
                    realdatetime: {
                        gte: timeRange.start,
                        lte: timeRange.end
                    }
                },
                select: {
                    temp_water: true,
                    ck_temp_cooling: true,
                    realdatetime: true
                },
                orderBy: { realdatetime: 'asc' }
            });
        } else if (date) {
            const dateObj = new Date(date);
            const startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0);
            const endDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59);
            
            data = await iotDB.ck_wafer_status.findMany({
                where: {
                    ...WHERE_L1,
                    realdatetime: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: {
                    temp_water: true,
                    ck_temp_cooling: true,
                    realdatetime: true
                },
                orderBy: { realdatetime: 'asc' }
            });
        } else {
            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
            const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            
            data = await iotDB.ck_wafer_status.findMany({
                where: {
                    ...WHERE_L1,
                    realdatetime: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: {
                    temp_water: true,
                    ck_temp_cooling: true,
                    realdatetime: true
                },
                orderBy: { realdatetime: 'asc' }
            });
        }
        
        if (data.length === 0) {
            return res.status(200).send({
                message: 'No data found',
                analysis: {}
            });
        }
        
        const validTempWater = data.filter(d => d.temp_water !== null && d.temp_water !== undefined).map(d => d.temp_water);
        const validTempCooling = data.filter(d => d.ck_temp_cooling !== null && d.ck_temp_cooling !== undefined).map(d => d.ck_temp_cooling);
        
        const result = {
            period: shift ? `Shift ${shift}${date ? ` - ${date}` : ''}` : (date || 'Today'),
            totalRecords: data.length
        };
        
        if (!type || type === 'water' || type === 'both') {
            result.temp_water = validTempWater.length > 0 ? {
                min: Math.min(...validTempWater),
                max: Math.max(...validTempWater),
                avg: validTempWater.reduce((a, b) => a + b, 0) / validTempWater.length,
                count: validTempWater.length,
                data: data.map(d => ({
                    value: d.temp_water,
                    realdatetime: d.realdatetime
                }))
            } : null;
        }
        
        if (!type || type === 'cooling' || type === 'both') {
            result.ck_temp_cooling = validTempCooling.length > 0 ? {
                min: Math.min(...validTempCooling),
                max: Math.max(...validTempCooling),
                avg: validTempCooling.reduce((a, b) => a + b, 0) / validTempCooling.length,
                count: validTempCooling.length,
                data: data.map(d => ({
                    value: d.ck_temp_cooling,
                    realdatetime: d.realdatetime
                }))
            } : null;
        }
        
        res.status(200).send(result);
    } catch (error) {
        console.error('Error in GET /cenkit_l1_temperature_analysis', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

// ==== STATUS ANALYSIS (Per Menit) ====
// Endpoint untuk analisis status mesin (aktif/nonaktif) per menit
export const getCenkitL1StatusAnalysis = async (req, res) => {
    try {
        const { shift, date } = req.query;
        let timeRange = null;
        let data = [];
        
        if (shift) {
            const shiftNum = parseInt(shift);
            if (![1, 2, 3].includes(shiftNum)) {
                return res.status(400).send({ error: 'Invalid shift. Must be 1, 2, or 3' });
            }
            const targetDate = date ? new Date(date) : new Date();
            timeRange = getShiftTimeRange(shiftNum, targetDate);
            
            data = await iotDB.ck_wafer_status.findMany({
                where: {
                    ...WHERE_L1,
                    realdatetime: {
                        gte: timeRange.start,
                        lte: timeRange.end
                    }
                },
                select: {
                    ck_status: true,
                    realdatetime: true
                },
                orderBy: { realdatetime: 'asc' }
            });
        } else if (date) {
            const dateObj = new Date(date);
            const startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0);
            const endDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59);
            
            data = await iotDB.ck_wafer_status.findMany({
                where: {
                    ...WHERE_L1,
                    realdatetime: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: {
                    ck_status: true,
                    realdatetime: true
                },
                orderBy: { realdatetime: 'asc' }
            });
        } else {
            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
            const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            
            data = await iotDB.ck_wafer_status.findMany({
                where: {
                    ...WHERE_L1,
                    realdatetime: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: {
                    ck_status: true,
                    realdatetime: true
                },
                orderBy: { realdatetime: 'asc' }
            });
        }
        
        if (data.length === 0) {
            return res.status(200).send({
                message: 'No data found',
                analysis: {}
            });
        }
        
        const statusData = data.filter(d => d.ck_status !== null && d.ck_status !== undefined);
        const activeCount = statusData.filter(d => d.ck_status === true).length;
        const inactiveCount = statusData.filter(d => d.ck_status === false).length;
        
        // Hitung durasi aktif dan nonaktif (dalam menit)
        let activeDurations = [];
        let inactiveDurations = [];
        let currentStatus = null;
        let statusStartTime = null;
        
        for (let i = 0; i < statusData.length; i++) {
            const current = statusData[i];
            if (currentStatus === null) {
                currentStatus = current.ck_status;
                statusStartTime = new Date(current.realdatetime);
            } else if (current.ck_status !== currentStatus) {
                // Status berubah
                const duration = (new Date(current.realdatetime) - statusStartTime) / (1000 * 60); // dalam menit
                if (currentStatus === true) {
                    activeDurations.push(duration);
                } else {
                    inactiveDurations.push(duration);
                }
                currentStatus = current.ck_status;
                statusStartTime = new Date(current.realdatetime);
            }
        }
        
        // Hitung durasi terakhir jika masih ada
        if (statusStartTime && statusData.length > 0) {
            const lastTime = new Date(statusData[statusData.length - 1].realdatetime);
            const duration = (lastTime - statusStartTime) / (1000 * 60);
            if (currentStatus === true) {
                activeDurations.push(duration);
            } else {
                inactiveDurations.push(duration);
            }
        }
        
        res.status(200).send({
            period: shift ? `Shift ${shift}${date ? ` - ${date}` : ''}` : (date || 'Today'),
            totalRecords: data.length,
            analysis: {
                total: statusData.length,
                active: {
                    count: activeCount,
                    percentage: (activeCount / statusData.length) * 100,
                    durations: activeDurations.length > 0 ? {
                        min: Math.min(...activeDurations),
                        max: Math.max(...activeDurations),
                        avg: activeDurations.reduce((a, b) => a + b, 0) / activeDurations.length,
                        total: activeDurations.reduce((a, b) => a + b, 0)
                    } : null
                },
                inactive: {
                    count: inactiveCount,
                    percentage: (inactiveCount / statusData.length) * 100,
                    durations: inactiveDurations.length > 0 ? {
                        min: Math.min(...inactiveDurations),
                        max: Math.max(...inactiveDurations),
                        avg: inactiveDurations.reduce((a, b) => a + b, 0) / inactiveDurations.length,
                        total: inactiveDurations.reduce((a, b) => a + b, 0)
                    } : null
                },
                data: statusData.map(d => ({
                    status: d.ck_status,
                    realdatetime: d.realdatetime
                }))
            }
        });
    } catch (error) {
        console.error('Error in GET /cenkit_l1_status_analysis', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};