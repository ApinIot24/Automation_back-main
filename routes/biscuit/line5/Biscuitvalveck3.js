import { Router } from "express";
import pool from "../../../config/util.js";
import { body, param, validationResult } from "express-validator";
import { getDurasiPeriodeValve, getStatusValve, getTotalDurasiValve } from "../../../controllers/biscuit/line5/BiscuitValveCK3Controller.js";

const app = Router();

// Middleware validasi parameter
const validate = [
  param("valve")
    .trim()
    .notEmpty()
    .withMessage("Valve harus diisi"),

  param("startdate")
    .isDate()
    .withMessage("Format tanggal mulai tidak valid"),

  param("enddate")
    .isDate()
    .withMessage("Format tanggal akhir tidak valid"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    next();
  },
];

// STATUS OPERASIONAL VALVE
app.get(
  "/ck_biscuit/valve/status/:valve/:startdate/:enddate",
  validate,
  getStatusValve
);
// TOTAL DURASI OPERASIONAL (SUM(EXTRACT(EPOCH)))
app.get(
  "/ck_biscuit/valve/durasi-total/:valve/:startdate/:enddate",
  validate,
  getTotalDurasiValve
);
// DURASI AKTIF & NON-AKTIF (CASE WHEN)
app.get(
  "/ck_biscuit/valve/durasi-periode/:valve/:startdate/:enddate",
  validate,
  getDurasiPeriodeValve
);
export default app;
