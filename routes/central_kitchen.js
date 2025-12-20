import { Router } from "express";
import {
  getCenkitL1,
  GetCenkitL1DailyByDate,
  GetCenkitL1WeeklyByDate,
  getHourlyCenkitL1ByDate,
  getShiftCenkitL1,
  getShiftEndCenkitL1,
  getCenkitL1SummaryStats,
  getCenkitL1WeightMixingPeaks,
  getCenkitL1TemperatureAnalysis,
  getCenkitL1StatusAnalysis,
} from "../controllers/CentralKitchen1Controller.js";
import {
  getCenkitL2,
  getCenkitL2All,
  GetCenkitL2Daily,
  GetCenkitL2DailyByDate,
  GetCenkitL2Weekly,
  GetCenkitL2WeeklyByDate,
  getHourlyCenkitL2,
  getHourlyCenkitL2ByDate,
  getShift1CenkitL2,
  getShift2CenkitL2,
  getShift3CenkitL2,
} from "../controllers/CentralKitchen2Controller.js";

const app = Router();

app.get("/cenkit_l1", getCenkitL1);
app.get("/cenkit_l1/shift/:shift", getShiftCenkitL1);
app.get("/end_cenkit_l1/shift/:shift", getShiftEndCenkitL1);
app.get("/cenkit_l1_hourly/date/:date", getHourlyCenkitL1ByDate);
app.get("/cenkit_l1_daily/date/:date", GetCenkitL1DailyByDate);
app.get("/cenkit_l1_weekly/date/:date", GetCenkitL1WeeklyByDate);

// ==== ANALYTICS ENDPOINTS ====
app.get("/cenkit_l1/summary", getCenkitL1SummaryStats);
app.get("/cenkit_l1/weight_peaks", getCenkitL1WeightMixingPeaks);
app.get("/cenkit_l1/temperature", getCenkitL1TemperatureAnalysis);
app.get("/cenkit_l1/status", getCenkitL1StatusAnalysis);

// ==== BASIC CENTRAL KITCHEN 2 ======
app.get("/cenkit_l2", getCenkitL2);
app.get("/cenkit_l2_all", getCenkitL2All);
app.get("/shift1_cenkit_l2", getShift1CenkitL2);
app.get("/shift2_cenkit_l2", getShift2CenkitL2);
app.get("/shift3_cenkit_l2", getShift3CenkitL2);
app.get("/cenkit_l2_hourly", getHourlyCenkitL2);
app.get("/cenkit_l2_hourly/date/:date", getHourlyCenkitL2ByDate);
app.get("/cenkit_l2_daily", GetCenkitL2Daily);
app.get("/cenkit_l2_daily/date/:date", GetCenkitL2DailyByDate);
app.get("/cenkit_l2_weekly", GetCenkitL2Weekly);
app.get("/cenkit_l2_weekly/date/:date", GetCenkitL2WeeklyByDate);

export default app;
