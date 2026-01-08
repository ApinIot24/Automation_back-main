import { iotDB } from "../src/db/iot.js";

const WHERE_L1 = { line: 'L1' };

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
    
    // Check if realdatetime is on target date or previous day (for shift 3)
    const isSameDay = dtDate.getTime() === targetDateOnly.getTime();
    const prevDay = new Date(targetDateOnly);
    prevDay.setDate(prevDay.getDate() - 1);
    const isPrevDay = dtDate.getTime() === prevDay.getTime();
    
    // Check each shift (1, 2, 3) on target date
    for (let shift = 1; shift <= 3; shift++) {
        const { start, end } = getShiftTimeRange(shift, date);
        if (dt >= start && dt <= end) {
            return shift;
        }
    }
    
    // Handle shift 3 that spans to next day (check previous day's shift 3)
    if (isPrevDay) {
        const { start, end } = getShiftTimeRange(3, prevDay);
        if (dt >= start && dt <= end) {
            return 3;
        }
    }
    
    return null;
};

// Helper function to get date range for a specific date
const getDateRange = (date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
};

// Helper function to convert seconds (float) to HH:mm:ss format
const secondsToTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return null;
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

// ==== WEIGHT MIXING HISTORY ====
// Endpoint untuk mendapatkan history weight_mixing dengan date range
export const getCenkitL1WeightMixingHistory = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).send({ 
                error: 'startDate and endDate query parameters are required. Format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss' 
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).send({ error: 'Invalid date format' });
        }

        if (start > end) {
            return res.status(400).send({ error: 'startDate must be before or equal to endDate' });
        }

        const data = await iotDB.ck_wafer_status.findMany({
            where: {
                ...WHERE_L1,
                realdatetime: {
                    gte: start,
                    lte: end
                },
                weight_mixing: {
                    not: null
                }
            },
            select: {
                id: true,
                weight_mixing: true,
                realdatetime: true
            },
            orderBy: { realdatetime: 'asc' }
        });

        res.status(200).send({
            startDate: start,
            endDate: end,
            totalRecords: data.length,
            data: data
        });
    } catch (error) {
        console.error('Error in GET /cenkit_l1/weight_mixing/history', error.message);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};

export const getFormasiBagianCenkitL1ByDate = async (req, res) => {
    try {
      const { date } = req.query;
  
      // Parse date if provided, otherwise use today
      let targetDate = new Date();
      if (date) {
        targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
          return res.status(400).send({ error: "Invalid date format. Use YYYY-MM-DD" });
        }
      }
  
      // Format date to YYYY-MM-DD
      const dateStr = targetDate.toISOString().split('T')[0];
  
      // Query data by date using DATE() function (not date range)
      // Using parameterized query for security
      const rows = await iotDB.$queryRawUnsafe(
        `
        SELECT 
          id,
          line,
          ck_status,
          ck_mixing,
          ck_temp_cooling,
          temp_water,
          timing_mixing,
          weight_mixing,
          weight_air,
          realdatetime
        FROM purwosari.ck_wafer_status
        WHERE line = 'L1'
          AND DATE(realdatetime) = $1
        ORDER BY realdatetime ASC
        `,
        dateStr
      );
  
      if (!rows || rows.length === 0) {
        return res.status(404).send({ error: "No data found for this date" });
      }
  
      // Group by shift first, then by batch within each shift
      const byShift = new Map(); // key: shift (1,2,3) -> Map(batch -> row[])
      
      for (const r of rows) {
        const shift = getShiftFromDateTime(r.realdatetime, targetDate);
        if (!shift) continue; // Skip if cannot determine shift
        
        if (!byShift.has(shift)) {
          byShift.set(shift, new Map());
        }
        
        const byBatch = byShift.get(shift);
        const batch = r.ck_mixing ?? 0;
        if (!byBatch.has(batch)) {
          byBatch.set(batch, []);
        }
        byBatch.get(batch).push(r);
      }

      // Process each shift
      const shiftResults = [];
      const shiftKeys = [1, 2, 3]; // Order: shift 1, 2, 3

      for (const shift of shiftKeys) {
        if (!byShift.has(shift)) {
          // Shift exists but no data
          shiftResults.push({
            shift: shift,
            batches: [],
            total_batch: 0
          });
          continue;
        }

        const byBatch = byShift.get(shift);
        const batchKeys = [...byBatch.keys()].sort((a, b) => a - b);
        const batchResults = [];

        for (let i = 0; i < batchKeys.length; i++) {
          const batch = batchKeys[i];
          
          // Skip batch 0
          if (batch === 0) continue;
          
          const batchRows = byBatch.get(batch);

          // START: TRUE pertama (mulai mixing beneran), fallback ke record pertama batch
          const firstTrue = batchRows.find((x) => x.ck_status === true && x.realdatetime);
          const start = firstTrue?.realdatetime || batchRows[0]?.realdatetime || null;

          // timing_mixing: ambil dari record terakhir dengan ck_status === true pada batch
          const lastTrue = [...batchRows].reverse().find((x) => x.ck_status === true && x.realdatetime);
          const timing_mixing_float = lastTrue?.timing_mixing ?? null;
          const timing_mixing = timing_mixing_float != null ? secondsToTime(timing_mixing_float) : null;

          let weight_air = 0;
          if (firstTrue?.weight_air != null) {
            weight_air = parseFloat(firstTrue.weight_air);
          } else {
            const firstTrueWithWeight = batchRows.find((x) => x.ck_status === true && x.weight_air != null);
            weight_air = firstTrueWithWeight?.weight_air != null ? parseFloat(firstTrueWithWeight.weight_air) : 0;
          }

          // selesai: TRUE terakhir pada batch tsb (menggunakan lastTrue yang sudah dideklarasikan di atas)
          const selesai = lastTrue?.realdatetime || null;

          // empyting: dari selesai (TRUE terakhir) -> FALSE pertama SETELAH selesai dalam batch yang sama
          // Mencari transisi dari true ke false, hitung durasi dari selesai ke false pertama
          let empyting = null;
          if (selesai) {
            // Cari record pertama dengan ck_status = false setelah selesai (dari akhir batch)
            const firstFalseAfterSelesai = batchRows.find((x) => {
              if (!x.realdatetime) return false;
              return new Date(x.realdatetime) > new Date(selesai) && x.ck_status === false;
            });

            if (firstFalseAfterSelesai?.realdatetime) {
              const durationMs =
                new Date(firstFalseAfterSelesai.realdatetime).getTime() - new Date(selesai).getTime();
              empyting = secondsToTime(Math.floor(durationMs / 1000));
            }
          }

          // frekuensi empty: jumlah record weight_mixing == 0 pada batch tsb
          const frekuensi_Empty = batchRows.filter((x) => x.weight_mixing === 0).length;

          // menit_2 & menit_6: ambil weight_mixing pada waktu start + 2 menit dan start + 6 menit
          let menit_2 = null;
          let menit_6 = null;
          
          if (start) {
            const startDateObj = new Date(start);
            const targetTime2 = new Date(startDateObj.getTime() + 2 * 60 * 1000); // start + 2 menit
            const targetTime6 = new Date(startDateObj.getTime() + 6 * 60 * 1000); // start + 6 menit
            
            // Cari record yang realdatetime paling dekat dengan targetTime2 (dalam batch yang sama)
            const closest2 = batchRows.reduce((closest, current) => {
              if (current.realdatetime) {
                const currentTime = new Date(current.realdatetime);
                const currentDiff = Math.abs(currentTime.getTime() - targetTime2.getTime());
                
                if (!closest || currentDiff < Math.abs(new Date(closest.realdatetime).getTime() - targetTime2.getTime())) {
                  return current;
                }
              }
              return closest;
            }, null);
            
            // Cari record yang realdatetime paling dekat dengan targetTime6 (dalam batch yang sama)
            const closest6 = batchRows.reduce((closest, current) => {
              if (current.realdatetime) {
                const currentTime = new Date(current.realdatetime);
                const currentDiff = Math.abs(currentTime.getTime() - targetTime6.getTime());
                
                if (!closest || currentDiff < Math.abs(new Date(closest.realdatetime).getTime() - targetTime6.getTime())) {
                  return current;
                }
              }
              return closest;
            }, null);
            
            // Ambil weight_mixing dari record terdekat (format dengan 2 desimal)
            menit_2 = closest2?.weight_mixing != null ? parseFloat(closest2.weight_mixing.toFixed(2)) : null;
            menit_6 = closest6?.weight_mixing != null ? parseFloat(closest6.weight_mixing.toFixed(2)) : null;
          }

          batchResults.push({
            batch,
            weight_air,
            start,
            menit_2,
            menit_6,
            timing_mixing,
            selesai,
            empyting,
            frekuensi_Empty,
          });
        }

        shiftResults.push({
          shift: shift,
          batches: batchResults,
          total_batch: batchResults.length
        });
      }

      // Final response
      const response = {
        date: dateStr,
        shifts: shiftResults,
      };
  
      return res.status(200).send(response);
    } catch (error) {
      console.error("Error in GET /cenkit_l1/formasi_bagian/date", error.message);
      return res.status(500).send({ error: "Internal Server Error" });
    }
  };
  
