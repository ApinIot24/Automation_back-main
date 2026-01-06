import { Router } from "express";
import {
  GetPackingRencengL2a,
  GetPackingTrayL2a,
  GetShift_L2a,
  GetPackingL2aRencengAll,
  GetPackingL2aTrayAll,
  GetShift1L2aRenceng,
  GetShift2L2aRenceng,
  GetShift3L2aRenceng,
  GetShift1L2aTray,
  GetShift2L2aTray,
  GetShift3L2aTray,
  GetShift1L2aRencengHourly,
  GetShift2L2aRencengHourly,
  GetShift3L2aRencengHourly,
  GetShift1L2aTrayHourly,
  GetShift2L2aTrayHourly,
  GetShift3L2aTrayHourly,
  GetShift3L2aRencengHourlyByDate,
  GetShift3L2aTrayHourlyByDate,
  GetPackingL2aRencengHourly,
  GetPackingL2aRencengHourlyByDate,
  GetPackingL2aTrayHourly,
  GetPackingL2aTrayHourlyByDate,
  GetPackingL2aRencengDaily,
  GetPackingL2aRencengDailyByDate,
  GetPackingL2aTrayDaily,
  GetPackingL2aTrayDailyByDate,
  GetPackingL2aRencengWeekly,
  GetPackingL2aRencengWeeklyByDate,
  GetPackingL2aTrayWeekly,
  GetPackingL2aTrayWeeklyByDate,
} from "../../../controllers/biscuit/line2/Line2aController.js";

const app = Router();

// Shift overview
app.get("/shift_l2a", GetShift_L2a);

// Basic packing L2a
app.get("/packingrenceng_l2a", GetPackingRencengL2a);
app.get("/packingrenceng_l2a_all", GetPackingL2aRencengAll);
app.get("/packingtray_l2a", GetPackingTrayL2a);
app.get("/packingtray_l2a_all", GetPackingL2aTrayAll);

// Shift L2a
app.get("/shift1renceng_l2a", GetShift1L2aRenceng);
app.get("/shift2renceng_l2a", GetShift2L2aRenceng);
app.get("/shift3renceng_l2a", GetShift3L2aRenceng);
app.get("/shift1tray_l2a", GetShift1L2aTray);
app.get("/shift2tray_l2a", GetShift2L2aTray);
app.get("/shift3tray_l2a", GetShift3L2aTray);

// Shift hourly L2a
app.get("/shift1renceng_l2a_hourly", GetShift1L2aRencengHourly);
app.get("/shift2renceng_l2a_hourly", GetShift2L2aRencengHourly);
app.get("/shift3renceng_l2a_hourly", GetShift3L2aRencengHourly);
app.get("/shift1tray_l2a_hourly", GetShift1L2aTrayHourly);
app.get("/shift2tray_l2a_hourly", GetShift2L2aTrayHourly);
app.get("/shift3tray_l2a_hourly", GetShift3L2aTrayHourly);

// By date (shift 3)
app.get("/shift3renceng_l2a_hourly/:date", GetShift3L2aRencengHourlyByDate);
app.get("/shift3tray_l2a_hourly/:date", GetShift3L2aTrayHourlyByDate);

// Hourly & By Date
app.get("/packingrenceng_l2a_hourly", GetPackingL2aRencengHourly);
app.get("/packingrenceng_l2a_hourly/date/:date", GetPackingL2aRencengHourlyByDate);
app.get("/packingtray_l2a_hourly", GetPackingL2aTrayHourly);
app.get("/packingtray_l2a_hourly/date/:date", GetPackingL2aTrayHourlyByDate);

// Daily & Weekly
app.get("/packingrenceng_l2a_daily", GetPackingL2aRencengDaily);
app.get("/packingrenceng_l2a_daily/date/:date", GetPackingL2aRencengDailyByDate);
app.get("/packingrenceng_l2a_weekly", GetPackingL2aRencengWeekly);
app.get("/packingrenceng_l2a_weekly/date/:date", GetPackingL2aRencengWeeklyByDate);
app.get("/packingtray_l2a_daily", GetPackingL2aTrayDaily);
app.get("/packingtray_l2a_daily/date/:date", GetPackingL2aTrayDailyByDate);
app.get("/packingtray_l2a_weekly", GetPackingL2aTrayWeekly);
app.get("/packingtray_l2a_weekly/date/:date", GetPackingL2aTrayWeeklyByDate);

export default app;
