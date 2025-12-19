import { Router } from "express";
import {
  GetPackingL5,
  GetPackingL5All,
  GetPackingL5Daily,
  GetPackingL5DailyByDate,
  GetPackingL5Hourly,
  GetPackingL5HourlyByDate,
  GetPackingL5Weekly,
  GetPackingL5WeeklyByDate,
  GetShift1L5,
  GetShift1L5Hourly,
  GetShift2L5,
  GetShift2L5Hourly,
  GetShift3L5,
  GetShift3L5Hourly,
  GetShift3L5HourlyByDate,
  GetShift_L5,
  GetTiltingHourlyL5,
  GetTiltingShift_L5,
  GetTiltingL5,
} from "../../../controllers/biscuit/line5/Line5Controller.js";
const app = Router();

// ==== BASIC PACKING L5 ====
app.get("/packing_l5", GetPackingL5);
app.get("/shift_l5", GetShift_L5);
app.get("/packing_l5_all", GetPackingL5All);

// Shift l5
app.get("/shift1_l5", GetShift1L5);
app.get("/shift2_l5", GetShift2L5);
app.get("/shift3_l5", GetShift3L5);
// ==== SHIFT HOURLY ====
app.get("/shift1_l5_hourly", GetShift1L5Hourly);
app.get("/shift2_l5_hourly", GetShift2L5Hourly);
app.get("/shift3_l5_hourly", GetShift3L5Hourly);
// ==== BY DATE ====
app.get("/shift3_l5_hourly/:date", GetShift3L5HourlyByDate);
// ==== Hourly & By Date ====
app.get("/packing_l5_hourly", GetPackingL5Hourly);
app.get("/packing_l5_hourly/date/:date", GetPackingL5HourlyByDate);
// ==== Daily & Weekly ====
app.get("/packing_l5_daily", GetPackingL5Daily);
app.get("/packing_l5_daily/date/:date", GetPackingL5DailyByDate);
app.get("/packing_l5_weekly", GetPackingL5Weekly);
app.get("/packing_l5_weekly/date/:date", GetPackingL5WeeklyByDate);

// ==== Tilting ====
app.get("/tilting_l5", GetTiltingL5);
app.get("/tilting_hourly_l5", GetTiltingHourlyL5);
app.get("/tilting_shift_l5", GetTiltingShift_L5);

export default app;
