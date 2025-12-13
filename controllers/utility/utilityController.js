import moment from "moment";
import { rawIot as raw } from "../../config/sqlRaw.js";

export async function getHistoryTableRange(req, res) {
  try {
    const { utility, kwhpm, start_date, end_date } = req.params;

    const results = [];
    const now = moment();

    let current = moment(start_date);
    const last = moment(end_date);

    while (current.isSameOrBefore(last, "day")) {
      const dateStr = current.format("YYYY-MM-DD");
      const nextDateStr = current.clone().add(1, "days").format("YYYY-MM-DD");

      // ========== WAKTU QUERY ==========  
      const timestamps = {
        shift1: moment(`${dateStr} 15:00`).toISOString(),
        shift0: moment(`${dateStr} 07:00`).toISOString(),
        shift2: moment(`${dateStr} 23:00`).toISOString(),
        shift3: moment(`${nextDateStr} 07:00`).toISOString(),

        h08: moment(`${dateStr} 08:00`).toISOString(),
        h17: moment(`${dateStr} 17:00`).toISOString(),
        h22: moment(`${dateStr} 22:00`).toISOString(),
        h03: moment(`${nextDateStr} 03:00`).toISOString()
      };

      // ========== BUNDLE QUERY ==========  
      const queryKeys = Object.keys(timestamps);

      const queryPromises = queryKeys.map((key) =>
        raw(
          `SELECT ${kwhpm} FROM purwosari.${utility} 
           WHERE created_at <= '${timestamps[key]}'
           ORDER BY created_at DESC 
           LIMIT 1`
        )
      );

      const queryResults = await Promise.all(queryPromises);

      // Mapping hasil
      const dataMap = {};
      queryKeys.forEach((key, idx) => {
        dataMap[key] = queryResults[idx][0]?.[kwhpm] ?? 0;
      });

      const s1 = dataMap.shift1;
      const s0 = dataMap.shift0;
      const s2 = dataMap.shift2;
      const s3 = dataMap.shift3;

      const h08 = dataMap.h08;
      const h17 = dataMap.h17;
      const h22 = dataMap.h22;
      const h03 = dataMap.h03;

      // ========== FINAL RESULT PER DATE ==========  
      results.push({
        date: dateStr,

        shift1: s1,
        shift0: s0,
        shift1MinusShift0: s1 - s0,

        shift2: s2,
        shift2MinusShift1: s2 - s1,

        shift3: s3,
        shift3MinusShift2: s3 - s2,

        hours_08: h08,
        hours_17: now.isBefore(moment(`${dateStr} 17:00`)) ? 0 : h17,
        hours_22: now.isBefore(moment(`${dateStr} 22:00`)) ? 0 : h22,
        hours_03: now.isBefore(moment(`${nextDateStr} 03:00`)) ? 0 : h03
      });

      current.add(1, "days");
    }

    res.json(results);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getHistoryPerHour(req, res) {
  try {
    const { utility, kwhpm, start_date, end_date } = req.params;

    const startTimestamp = moment(`${start_date} 00:00:00`).toISOString();
    const endTimestamp = moment(`${end_date} 23:59:59`).toISOString();

    const rows = await raw(
      `
      WITH hourly_data AS (
        SELECT 
          created_at,
          ${kwhpm} AS kwh,
          DATE_TRUNC('hour', created_at) AS hour
        FROM purwosari.${utility}
        WHERE created_at BETWEEN '${startTimestamp}' AND '${endTimestamp}'
      )
      SELECT DISTINCT ON (hour)
        created_at,
        kwh,
        hour
      FROM hourly_data
      ORDER BY hour, created_at
      `
    );

    const formatted = rows.map(r => ({
      ...r,
      hour: moment(r.created_at).utcOffset(7).format("HH:mm"),
      created_at: moment(r.created_at).utcOffset(7).format("YYYY-MM-DD HH:mm:ss")
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getHistoryByHourRange(req, res) {
  try {
    const { utility, start_date, start_hour, end_date, end_hour } = req.params;

    const startTimestamp = moment(`${start_date} ${start_hour}:00`).toISOString();
    const endTimestamp = moment(`${end_date} ${end_hour}:00`).toISOString();

    const rows = await raw(
      `SELECT * FROM purwosari.${utility} WHERE created_at BETWEEN '${startTimestamp}' AND '${endTimestamp}'`
    );

    const formatted = rows.map(r => ({
      ...r,
      created_at: moment(r.created_at).utcOffset(7).format("YYYY-MM-DD HH:mm:ss")
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getHistoryAkhir(req, res) {
  try {
    const { utility, kwhpm, date } = req.params;

    const endTimestamp = moment(`${date} 23:59`, "YYYY-MM-DD HH:mm").toISOString();

    const rows = await raw(
      `
      SELECT created_at, ${kwhpm} AS kwh
      FROM purwosari.${utility}
      WHERE created_at <= '${endTimestamp}'
      ORDER BY created_at DESC
      LIMIT 1
      `
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Data not found" });
    }

    const row = rows[0];
    res.json({
      ...row,
      created_at: moment(row.created_at)
        .utcOffset(7)
        .format("YYYY-MM-DD HH:mm:ss")
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}