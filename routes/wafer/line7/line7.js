import { Router } from "express";
import { 
  GetPackingL7, GetPackingL7All, GetPackingL7Daily, GetPackingL7DailyByDate, 
  GetPackingL7Hourly, GetPackingL7HourlyByDate, GetPackingL7Weekly, GetPackingL7WeeklyByDate, 
  GetShift1L7, GetShift1L7Hourly, GetShift2L7, GetShift2L7Hourly, 
  GetShift3L7, GetShift3L7Hourly, GetShift_L7 } 
  from "../../../controllers/wafer/line7/Line6Controller.js";
const app = Router();

// ===================== ROUTES =====================
// ==== BASIC PACKING L7 ====
app.get("/packing_l7", GetPackingL7);
app.get("/shift_l7", GetShift_L7);
app.get("/packing_l7_all", GetPackingL7All);
// ==== SHIFT ====
app.get("/shift1_l7", GetShift1L7);
app.get("/shift2_l7", GetShift2L7);
app.get("/shift3_l7", GetShift3L7);
// ==== SHIFT HOURLY ====
app.get("/shift1_l7_hourly", GetShift1L7Hourly);
app.get("/shift2_l7_hourly", GetShift2L7Hourly);
app.get("/shift3_l7_hourly", GetShift3L7Hourly);
// ==== ini PACKING L7 PERJAM ====
app.get("/packing_l7_hourly", GetPackingL7Hourly);
app.get("/packing_l7_hourly/date/:date", GetPackingL7HourlyByDate);
// ==== ini PACKING L7 DAILY & WEEKLY ====
app.get("/packing_l7_daily", GetPackingL7Daily);
app.get("/packing_l7_daily/date/:date", GetPackingL7DailyByDate);
app.get("/packing_l7_weekly", GetPackingL7Weekly);
app.get("/packing_l7_weekly/date/:date", GetPackingL7WeeklyByDate);

export default app;