import { Router } from "express";
import { param, validationResult } from "express-validator";
import { getDurasiPeriode, getStatus, getTotalDurasi } from "../../../controllers/biscuit/line5/BiscuitAgigatorck3Controller.js";

const app = Router();

// Middleware validasi parameter
const validate = [
  param("agitator").notEmpty().withMessage("Agitator harus diisi"),
  param("startdate").isDate().withMessage("Format tanggal mulai tidak valid"),
  param("enddate").isDate().withMessage("Format tanggal akhir tidak valid"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

// Fungsi untuk mengambil status operasional agitator dalam rentang tanggal
app.get( "/ck_biscuit/agitator/status/:agitator/:startdate/:enddate",
  validate,
  getStatus
);

// Fungsi untuk menghitung durasi operasional agitator dalam rentang tanggal
app.get(
  "/ck_biscuit/agitator/durasi-total/:agitator/:startdate/:enddate",
  validate,
  getTotalDurasi
);

// Fungsi untuk menampilkan total durasi aktif dan non-aktif agitator
app.get(
  "/ck_biscuit/agitator/durasi-periode/:agitator/:startdate/:enddate",
  validate,
  getDurasiPeriode
);
export default app;