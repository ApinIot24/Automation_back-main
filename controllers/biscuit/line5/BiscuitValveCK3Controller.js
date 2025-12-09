import { rawAutomation as raw } from "../../../config/sqlRaw.js";

export const getStatusValve = async (req, res) => {
  const { valve, startdate, enddate } = req.params;

  try {
    const sql = `
      SELECT 
        id,
        valve,
        jam_aktif,
        jam_non_aktif,
        durasi,
        status,
        tanggal
      FROM automation.ck_biscuit_valve
      WHERE valve = '${valve}'
      AND tanggal BETWEEN '${startdate}' AND '${enddate}'
      ORDER BY jam_aktif;
    `;

    const rows = await raw(sql);

    if (!rows.length) {
      return res.status(404).json({
        message: "Tidak ada data operasional valve dalam rentang tanggal tersebut",
        details: { valve, startdate, enddate },
      });
    }

    res.json({
      valve,
      status_history: rows,
      total_records: rows.length,
    });
  } catch (err) {
    console.error("getStatusValve Error:", err);
    res.status(500).json({ message: "Gagal mengambil status valve", error: err.message });
  }
};
export const getTotalDurasiValve = async (req, res) => {
  const { valve, startdate, enddate } = req.params;

  try {
    const sql = `
      SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM durasi)), 0) / 3600 AS total_durasi,
        COUNT(*) AS total_kejadian,
        MIN(jam_aktif) AS waktu_pertama,
        MAX(jam_non_aktif) AS waktu_terakhir
      FROM automation.ck_biscuit_valve
      WHERE valve = '${valve}'
      AND tanggal BETWEEN '${startdate}' AND '${enddate}';
    `;

    const [row] = await raw(sql);
    const durasi = parseFloat(row.total_durasi);

    if (durasi === 0) {
      return res.status(404).json({
        message: "Tidak ada durasi operasional ditemukan",
        details: { valve, startdate, enddate },
      });
    }

    res.json({
      valve,
      total_durasi: durasi.toFixed(2),
      total_kejadian: row.total_kejadian,
      waktu_pertama: row.waktu_pertama,
      waktu_terakhir: row.waktu_terakhir,
    });
  } catch (err) {
    console.error("getTotalDurasiValve Error:", err);
    res.status(500).json({ message: "Gagal menghitung total durasi", error: err.message });
  }
};
export const getDurasiPeriodeValve = async (req, res) => {
  const { valve, startdate, enddate } = req.params;

  try {
    const sql = `
      SELECT
        COALESCE(SUM(CASE WHEN status = TRUE  THEN EXTRACT(EPOCH FROM durasi) ELSE 0 END), 0) / 3600 AS durasi_aktif,
        COALESCE(SUM(CASE WHEN status = FALSE THEN EXTRACT(EPOCH FROM durasi) ELSE 0 END), 0) / 3600 AS durasi_non_aktif,
        COUNT(CASE WHEN status = TRUE  THEN 1 END) AS total_kejadian_aktif,
        COUNT(CASE WHEN status = FALSE THEN 1 END) AS total_kejadian_non_aktif
      FROM automation.ck_biscuit_valve
      WHERE valve = '${valve}'
      AND tanggal BETWEEN '${startdate}' AND '${enddate}';
    `;

    const [row] = await raw(sql);

    const aktif = parseFloat(row.durasi_aktif);
    const nonAktif = parseFloat(row.durasi_non_aktif);

    if (aktif === 0 && nonAktif === 0) {
      return res.status(404).json({
        message: "Tidak ada durasi operasional dalam rentang tanggal tersebut",
        details: { valve, startdate, enddate },
      });
    }

    res.json({
      valve,
      durasi_aktif: aktif.toFixed(2),
      durasi_non_aktif: nonAktif.toFixed(2),
      total_kejadian_aktif: row.total_kejadian_aktif,
      total_kejadian_non_aktif: row.total_kejadian_non_aktif,
    });
  } catch (err) {
    console.error("getDurasiPeriodeValve Error:", err);
    res.status(500).json({ message: "Gagal menghitung durasi periode", error: err.message });
  }
};