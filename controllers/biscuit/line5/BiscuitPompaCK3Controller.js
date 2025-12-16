import { rawIot as raw } from "../../../config/sqlRaw.js";
import { iotDB } from "../../../src/db/iot.js";

export const getPompaStatus = async (req, res) => {
  const { pompa, startdate, enddate } = req.params;

  try {
    const rows = await iotDB.ck_biscuit_pompa.findMany({
      where: {
        pompa,
        tanggal: {
          gte: new Date(startdate),
          lte: new Date(enddate),
        }
      },
      orderBy: { jam_aktif: "asc" }
    });

    if (!rows.length) {
      return res.status(404).json({
        message: "Tidak ada data operasional pompa dalam rentang tanggal tersebut",
        details: { pompa, startdate, enddate },
      });
    }

    res.json({
      pompa,
      status_history: rows,
      total_records: rows.length,
    });

  } catch (err) {
    res.status(500).json({
      message: "Gagal mengambil status pompa",
      error: err.message,
    });
  }
};
export const getPompaDurasiTotal = async (req, res) => {
  const { pompa, startdate, enddate } = req.params;

  try {
    const sql = `
      SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM durasi)), 0) / 3600 AS total_durasi,
        COUNT(*) AS total_kejadian,
        MIN(jam_aktif) AS waktu_pertama,
        MAX(jam_non_aktif) AS waktu_terakhir
      FROM purwosari.ck_biscuit_pompa
      WHERE pompa='${pompa}'
      AND tanggal BETWEEN '${startdate}' AND '${enddate}';
    `;

    const [row] = await raw(sql);

    const dur = parseFloat(row.total_durasi);

    if (dur === 0) {
      return res.status(404).json({
        message: "Tidak ada durasi operasional dalam rentang tersebut",
        details: { pompa, startdate, enddate }
      });
    }

    res.json({
      pompa,
      total_durasi: dur.toFixed(2),
      total_kejadian: Number(row.total_kejadian),
      waktu_pertama: row.waktu_pertama,
      waktu_terakhir: row.waktu_terakhir
    });

  } catch (err) {
    console.error("getPompaDurasiTotal Error:", err);
    res.status(500).json({
      message: "Gagal menghitung total durasi pompa",
      error: err.message
    });
  }
};
export const getPompaDurasiPeriode = async (req, res) => {
  const { pompa, startdate, enddate } = req.params;

  try {
    const sql = `
      SELECT
        COALESCE(SUM(CASE WHEN status = TRUE THEN EXTRACT(EPOCH FROM durasi) ELSE 0 END), 0) / 3600 AS durasi_aktif,
        COALESCE(SUM(CASE WHEN status = FALSE THEN EXTRACT(EPOCH FROM durasi) ELSE 0 END), 0) / 3600 AS durasi_non_aktif,
        COUNT(CASE WHEN status = TRUE THEN 1 END) AS total_kejadian_aktif,
        COUNT(CASE WHEN status = FALSE THEN 1 END) AS total_kejadian_non_aktif
      FROM purwosari.ck_biscuit_pompa
      WHERE pompa='${pompa}'
      AND tanggal BETWEEN '${startdate}' AND '${enddate}';
    `;

    const [row] = await raw(sql);

    const akt = parseFloat(row.durasi_aktif);
    const non = parseFloat(row.durasi_non_aktif);

    if (akt === 0 && non === 0) {
      return res.status(404).json({
        message: "Tidak ada durasi operasional dalam rentang tanggal tersebut",
        details: { pompa, startdate, enddate }
      });
    }

    res.json({
      pompa,
      durasi_aktif: akt.toFixed(2),
      durasi_non_aktif: non.toFixed(2),
      total_kejadian_aktif: Number(row.total_kejadian_aktif),
      total_kejadian_non_aktif: Number(row.total_kejadian_non_aktif)
    });

  } catch (err) {
    console.error("getPompaDurasiPeriode Error:", err);
    res.status(500).json({
      message: "Gagal menghitung durasi periode pompa",
      error: err.message
    });
  }
};