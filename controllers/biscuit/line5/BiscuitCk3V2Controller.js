import { rawIot } from "../../../config/sqlRaw.js";

function isValidName(name) {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

export const PostLoadcellProcessedV2 = async (req, res) => {
  const { startDate, endDate, additionalData } = req.body;

  if (!Array.isArray(additionalData) || additionalData.length === 0) {
    return res.status(400).send("additionalData harus array dan tidak kosong.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return res.status(400).send("Format tanggal tidak valid (harus YYYY-MM-DD).");
  }

  const results = { chartData: [], tableData: [] };

  try {
    const promises = additionalData.map(async (tankName) => {
      if (!isValidName(tankName)) return null;

      const sql = `
        SELECT 
          to_char(date_trunc('hour', timestamp AT TIME ZONE 'Asia/Jakarta'),
                  'YYYY-MM-DD HH24:00:00') AS jam_wib,
          ROUND(AVG(berat)::numeric, 2) AS berat_rata
        FROM purwosari.tankck3
        WHERE tank = '${tankName}'
          AND (timestamp AT TIME ZONE 'Asia/Jakarta')::date BETWEEN '${startDate}' AND '${endDate}'
        GROUP BY date_trunc('hour', timestamp AT TIME ZONE 'Asia/Jakarta')
        ORDER BY jam_wib ASC;
      `;

      const rows = await rawIot(sql);
      if (!rows.length) return null;

      // ----------- CHART DATA -----------
      const chartData = {
        labels: rows.map((r) => r.jam_wib),
        values: rows.map((r) => Number(r.berat_rata)),
      };

      // ----------- TABLE SUMMARY PER DAY -----------
      const grouped = {};
      rows.forEach((row) => {
        const date = row.jam_wib.split(" ")[0];
        grouped[date] = grouped[date] || [];
        grouped[date].push(Number(row.berat_rata));
      });

      const tableData = Object.entries(grouped).map(([date, arr]) => {
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        return {
          database: tankName,
          date,
          average: Number(avg.toFixed(2)),
          max: Number(Math.max(...arr).toFixed(2)),
          min: Number(Math.min(...arr).toFixed(2)),
          samples: arr.length,
        };
      });

      return { tankName, chartData, tableData };
    });

    const allResults = (await Promise.all(promises)).filter(Boolean);

    allResults.forEach(({ tankName, chartData, tableData }) => {
      results.chartData.push({
        database: tankName.toUpperCase(),
        chartData,
      });
      results.tableData.push(...tableData);
    });

    results.tableData.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ results });
  } catch (error) {
    console.error("Error POST loadcell v2:", error);
    res.status(500).send("Internal server error.");
  }
}

export const getLoadcellProcessedV2 = async (req, res) => {
  const { startDate, endDate, additionalData } = req.query;

  if (!additionalData) {
    return res.status(400).send("additionalData wajib diisi (dipisah koma).");
  }

  const tanks = additionalData.split(",").map((v) => v.trim()).filter(Boolean);

  if (!tanks.length) {
    return res.status(400).send("additionalData tidak valid.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return res.status(400).send("Format tanggal salah (gunakan YYYY-MM-DD).");
  }

  const results = { chartData: [], tableData: [] };

  try {
    const promises = tanks.map(async (tankName) => {
      if (!isValidName(tankName)) return null;

      const sql = `
        SELECT
          to_char(timestamp AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI:SS') AS timestamp_wib,
          berat
        FROM purwosari.tankck3
        WHERE tank = '${tankName}'
          AND (timestamp AT TIME ZONE 'Asia/Jakarta')::date BETWEEN '${startDate}' AND '${endDate}'
        ORDER BY timestamp ASC;
      `;

      const rows = await rawIot(sql);
      if (!rows.length) return null;

      const chartData = {
        labels: rows.map((r) => r.timestamp_wib),
        values: rows.map((r) => Number(r.berat)),
      };

      const grouped = {};
      rows.forEach((r) => {
        const date = r.timestamp_wib.split(" ")[0];
        grouped[date] = grouped[date] || [];
        grouped[date].push(Number(r.berat));
      });

      const tableData = Object.entries(grouped).map(([date, arr]) => ({
        database: tankName,
        date,
        average: Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)),
        max: Number(Math.max(...arr).toFixed(2)),
        min: Number(Math.min(...arr).toFixed(2)),
        samples: arr.length,
      }));

      return { tankName, chartData, tableData };
    });

    const all = (await Promise.all(promises)).filter(Boolean);

    all.forEach(({ tankName, chartData, tableData }) => {
      results.chartData.push({
        database: tankName.toUpperCase(),
        chartData,
      });

      results.tableData.push(...tableData);
    });

    results.tableData.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`[OK] Processed ${allResults.length} tanks: ${tanks.join(", ")}`);
    res.json({ results });
  } catch (err) {
    console.error("Error GET loadcell v2:", err);
    res.status(500).send("Internal server error.");
  }
};