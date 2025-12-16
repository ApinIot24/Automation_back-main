import { iotDB } from "../../../src/db/iot.js";

export const getStatus = async (req, res) => {
  const { agitator, startdate, enddate } = req.params;

  try {
    const rows = await iotDB.ck_biscuit_agitator.findMany({
      where: {
        agitator,
        tanggal: {
          gte: new Date(startdate),
          lte: new Date(enddate),
        },
      },
      select: {
        id: true,
        agitator: true,
        jam_aktif: true,
        jam_non_aktif: true,
        status: true,
        tanggal: true,
      },
      orderBy: { jam_aktif: "asc" },
    });

    if (!rows.length) {
      return res.status(404).json({
        message: "Tidak ada data operasional agitator dalam rentang tanggal tersebut",
        details: { agitator, startdate, enddate },
      });
    }

    // Serialize data to handle BigInt and Date objects
    const serializedRows = rows.map(row => ({
      ...row,
      id: Number(row.id),
      jam_aktif: row.jam_aktif ? new Date(row.jam_aktif).toISOString() : null,
      jam_non_aktif: row.jam_non_aktif ? new Date(row.jam_non_aktif).toISOString() : null,
      tanggal: row.tanggal ? new Date(row.tanggal).toISOString() : null,
    }));

    res.status(200).json({
      agitator,
      status_history: serializedRows,
      total_records: serializedRows.length,
    });
  } catch (err) {
    console.error("getStatus Error:", err);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data",
      error: err.message,
    });
  }
};

export const getTotalDurasi = async (req, res) => {
  const { agitator, startdate, enddate } = req.params;

  try {
    const result = await iotDB.$queryRawUnsafe(
      `
      SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM durasi)), 0) / 3600 AS total_durasi,
        COUNT(*) AS total_kejadian,
        MIN(jam_aktif) AS waktu_pertama,
        MAX(jam_non_aktif) AS waktu_terakhir
      FROM purwosari.ck_biscuit_agitator
      WHERE agitator = $1
        AND tanggal BETWEEN $2 AND $3
      `,
      agitator,
      startdate,
      enddate
    );

    const data = result[0];
    const totalDurasi = parseFloat(data.total_durasi);

    if (totalDurasi === 0) {
      return res.status(404).json({
        message: "Tidak ada durasi operasional dalam rentang tanggal tersebut",
        details: { agitator, startdate, enddate },
      });
    }

    res.json({
      agitator,
      total_durasi: totalDurasi.toFixed(2),
      total_kejadian: Number(data.total_kejadian),
      waktu_pertama: data.waktu_pertama,
      waktu_terakhir: data.waktu_terakhir,
    });

  } catch (err) {
    res.status(500).json({
      message: "Terjadi kesalahan saat menghitung durasi",
      error: err.message,
    });
  }
};

export const getDurasiPeriode = async (req, res) => {
  const { agitator, startdate, enddate } = req.params;

  try {
    const result = await iotDB.$queryRawUnsafe(
      `
      SELECT
        COALESCE(SUM(CASE WHEN status = TRUE THEN EXTRACT(EPOCH FROM durasi) ELSE 0 END), 0) / 3600 AS durasi_aktif,
        COALESCE(SUM(CASE WHEN status = FALSE THEN EXTRACT(EPOCH FROM durasi) ELSE 0 END), 0) / 3600 AS durasi_non_aktif,
        COUNT(CASE WHEN status = TRUE THEN 1 END) AS total_kejadian_aktif,
        COUNT(CASE WHEN status = FALSE THEN 1 END) AS total_kejadian_non_aktif
      FROM purwosari.ck_biscuit_agitator
      WHERE agitator = $1
        AND tanggal BETWEEN $2 AND $3
      `,
      agitator,
      startdate,
      enddate
    );

    const row = result[0];
    
    if (!row) {
      return res.status(404).json({
        message: "Tidak ada data dalam rentang tanggal tersebut",
        details: { agitator, startdate, enddate },
      });
    }

    const durasiAktif = parseFloat(row.durasi_aktif || 0);
    const durasiNonAktif = parseFloat(row.durasi_non_aktif || 0);

    if (durasiAktif === 0 && durasiNonAktif === 0) {
      return res.status(404).json({
        message: "Tidak ada durasi operasional dalam rentang tanggal tersebut",
        details: { agitator, startdate, enddate },
      });
    }

    res.json({
      agitator,
      durasi_aktif: isNaN(durasiAktif) ? "0.00" : durasiAktif.toFixed(2),
      durasi_non_aktif: isNaN(durasiNonAktif) ? "0.00" : durasiNonAktif.toFixed(2),
      total_kejadian_aktif: Number(row.total_kejadian_aktif || 0),
      total_kejadian_non_aktif: Number(row.total_kejadian_non_aktif || 0),
    });

  } catch (err) {
    console.error("getDurasiPeriode Error:", err);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil durasi periode",
      error: err.message,
    });
  }
};