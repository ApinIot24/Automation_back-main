import { Router } from "express";
import { param, validationResult } from "express-validator";
import { getPompaDurasiPeriode, getPompaDurasiTotal, getPompaStatus } from "../../../controllers/biscuit/line5/BiscuitPompaCK3Controller.js";

const app = Router();

const validate = [
  param("pompa").notEmpty().withMessage("Pompa harus diisi"),
  param("startdate").isDate().withMessage("Format tanggal mulai tidak valid"),
  param("enddate").isDate().withMessage("Format tanggal akhir tidak valid"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

// Fungsi untuk mengambil status operasional pompa dalam rentang tanggal
app.get(
  "/ck_biscuit/pompa/status/:pompa/:startdate/:enddate",
  validate,
  getPompaStatus
);

// Fungsi untuk menghitung durasi operasional pompa dalam rentang tanggal
app.get(
  "/ck_biscuit/pompa/durasi-total/:pompa/:startdate/:enddate",
  validate,
  getPompaDurasiTotal
);

// Fungsi untuk menampilkan total durasi aktif dan non-aktif pompa
app.get(
  "/ck_biscuit/pompa/durasi-periode/:pompa/:startdate/:enddate",
  validate,
  getPompaDurasiPeriode
);
export default app;
