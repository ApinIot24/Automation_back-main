import { Router } from "express";
import pool from "../../../config/users.js";
import { body, param, validationResult } from "express-validator";

const app = Router();

// Middleware validasi parameter
const validateDateParams = [
  param("pompa").trim().notEmpty().withMessage("Pompa harus diisi"),
  param("startdate").isDate().withMessage("Format tanggal mulai tidak valid"),
  param("enddate").isDate().withMessage("Format tanggal akhir tidak valid"),
];

// Middleware untuk memeriksa validasi
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Fungsi utilitas untuk query dengan penanganan error
const safeQuery = async (queryText, params) => {
  try {
    const result = await pool.query(queryText, params);
    return result;
  } catch (err) {
    console.error("Database Query Error:", err);
    throw new Error("Kesalahan dalam mengakses database");
  }
};

// Fungsi untuk mengambil status operasional pompa dalam rentang tanggal
app.get(
  "/ck_biscuit/pompa/status/:pompa/:startdate/:enddate",
  validateDateParams,
  checkValidation,
  async (req, res) => {
    const { pompa, startdate, enddate } = req.params;

    try {
      const query = `
        SELECT 
          id,
          pompa,
          jam_aktif,
          jam_non_aktif,
          durasi,
          status,
          tanggal
        FROM purwosari.ck_biscuit_pompa
        WHERE 
          pompa = $1 AND
          tanggal BETWEEN $2 AND $3
        ORDER BY jam_aktif;
      `;

      const result = await safeQuery(query, [pompa, startdate, enddate]);
      console.log(result.rows); // Debugging log

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Tidak ada data operasional pompa dalam rentang tanggal tersebut",
          details: { pompa, startdate, enddate },
        });
      }

      res.status(200).json({
        pompa,
        status_history: result.rows,
        total_records: result.rows.length,
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan saat mengambil data",
        error: err.message,
      });
    }
  }
);

// Fungsi untuk menghitung durasi operasional pompa dalam rentang tanggal
app.get(
  "/ck_biscuit/pompa/durasi-total/:pompa/:startdate/:enddate",
  validateDateParams,
  checkValidation,
  async (req, res) => {
    const { pompa, startdate, enddate } = req.params;

    try {
      const query = `
        SELECT 
          COALESCE(SUM(EXTRACT(EPOCH FROM durasi)), 0) / 3600 AS total_durasi,
          COUNT(*) AS total_kejadian,
          MIN(jam_aktif) AS waktu_pertama,
          MAX(jam_non_aktif) AS waktu_terakhir
        FROM purwosari.ck_biscuit_pompa
        WHERE 
          pompa = $1 AND
          tanggal BETWEEN $2 AND $3;
      `;

      const result = await safeQuery(query, [pompa, startdate, enddate]);
      const totalDurasi = parseFloat(result.rows[0].total_durasi);

      if (totalDurasi === 0) {
        return res.status(404).json({
          message:
            "Tidak ada durasi operasional dalam rentang tanggal tersebut",
          details: { pompa, startdate, enddate },
        });
      }

      res.status(200).json({
        pompa,
        total_durasi: totalDurasi.toFixed(2),
        total_kejadian: result.rows[0].total_kejadian,
        waktu_pertama: result.rows[0].waktu_pertama,
        waktu_terakhir: result.rows[0].waktu_terakhir,
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan saat menghitung durasi",
        error: err.message,
      });
    }
  }
);

// Fungsi untuk menampilkan total durasi aktif dan non-aktif pompa
app.get(
  "/ck_biscuit/pompa/durasi-periode/:pompa/:startdate/:enddate",
  validateDateParams,
  checkValidation,
  async (req, res) => {
    const { pompa, startdate, enddate } = req.params;

    try {
      const query = `
        SELECT
          COALESCE(SUM(CASE WHEN status = TRUE THEN EXTRACT(EPOCH FROM durasi) ELSE 0 END), 0) / 3600 AS durasi_aktif,
          COALESCE(SUM(CASE WHEN status = FALSE THEN EXTRACT(EPOCH FROM durasi) ELSE 0 END), 0) / 3600 AS durasi_non_aktif,
          COUNT(CASE WHEN status = TRUE THEN 1 END) AS total_kejadian_aktif,
          COUNT(CASE WHEN status = FALSE THEN 1 END) AS total_kejadian_non_aktif
        FROM purwosari.ck_biscuit_pompa
        WHERE 
          pompa = $1 AND
          tanggal BETWEEN $2 AND $3;
      `;

      const result = await safeQuery(query, [pompa, startdate, enddate]);

      // Cek jika hasil tidak kosong
      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Tidak ada data ditemukan untuk rentang tanggal tersebut.",
          details: { pompa, startdate, enddate },
        });
      }

      const durasiAktif = parseFloat(result.rows[0].durasi_aktif);
      const durasiNonAktif = parseFloat(result.rows[0].durasi_non_aktif);

      if (durasiAktif === 0 && durasiNonAktif === 0) {
        return res.status(404).json({
          message: "Tidak ada durasi operasional dalam rentang tanggal tersebut",
          details: { pompa, startdate, enddate },
        });
      }

      res.status(200).json({
        pompa,
        durasi_aktif: durasiAktif.toFixed(2),
        durasi_non_aktif: durasiNonAktif.toFixed(2),
        total_kejadian_aktif: result.rows[0].total_kejadian_aktif,
        total_kejadian_non_aktif: result.rows[0].total_kejadian_non_aktif,
      });
    } catch (err) {
      res.status(500).json({
        message: "Terjadi kesalahan saat mengambil durasi periode",
        error: err.message,
      });
    }
  }
);
export default app;
