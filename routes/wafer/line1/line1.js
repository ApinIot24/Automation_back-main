import { Router } from "express";
import A1 from "./packing/A1.js";
import A2 from "./packing/A2.js";
import A3 from "./packing/A3.js";
import A5 from "./packing/A5.js";
import B5 from "./packing/B5.js";
import { GetPackingL1, GetPackingL1All, GetPackingL1Daily, GetPackingL1DailyByDate, GetPackingL1HourByDate, GetPackingL1Hourly, GetPackingL1Weekly, GetPackingL1WeeklyByDate, getShift1L1, GetShift1L1Hourly, GetShift2L1, GetShift2L1Hourly, GetShift3L1, GetShift3L1HourByDate, GetShift3L1Hourly, GetShift_L1 } from "../../../controllers/wafer/line1/Line1Controller.js";

const app = Router();


app.get("/packing_l1", GetPackingL1);

app.get("/shift_l1", GetShift_L1)
// Shift L1
app.get("/shift1_l1", getShift1L1);
app.get("/shift2_l1", GetShift2L1);
app.get("/shift3_l1", GetShift3L1);
// Shift l1 Hourly
app.get("/shift1_l1_hourly", GetShift1L1Hourly);
app.get("/shift2_l1_hourly", GetShift2L1Hourly);
app.get("/shift3_l1_hourly", GetShift3L1Hourly);
// By Date
app.get("/shift3_l1_hourly/:date", GetShift3L1HourByDate);
//All Data
app.get("/packing_l1_all", GetPackingL1All);
// Per Hourly
app.get("/packing_l1_hourly", GetPackingL1Hourly);
// By Date
app.get("/packing_l1_hourly/date/:date", GetPackingL1HourByDate);
// Daily & Weekly Data
app.get("/packing_l1_daily", GetPackingL1Daily);
app.get("/packing_l1_daily/date/:date", GetPackingL1DailyByDate);
app.get("/packing_l1_weekly", GetPackingL1Weekly);
app.get("/packing_l1_weekly/date/:date", GetPackingL1WeeklyByDate);

app.use("/", A1);
app.use("/", A2);
app.use("/", A3);
app.use("/", A5);
app.use("/", B5);

export default app;