import { Router } from "express";
import { 
    GetPackingL2bRencengAll, GetPackingL2bRencengDaily, GetPackingL2bRencengDailyByDate, GetPackingL2bRencengHourly, 
    GetPackingL2bRencengHourlyByDate, GetPackingL2bRencengWeekly, GetPackingL2bRencengWeeklyByDate, GetPackingL2bTrayAll, 
    GetPackingL2bTrayDaily, GetPackingL2bTrayDailyByDate, GetPackingL2bTrayHourly, GetPackingL2bTrayHourlyByDate, 
    GetPackingL2bTrayWeekly, GetPackingL2bTrayWeeklyByDate, GetPackingRencengL2b, GetPackingTrayL2b, GetShift1L2bRenceng, 
    GetShift1L2bRencengHourly, GetShift1L2bTray, GetShift1L2bTrayHourly, GetShift2L2bRenceng, GetShift2L2bRencengHourly, GetShift2L2bTray, 
    GetShift2L2bTrayHourly, GetShift3L2bRenceng, GetShift3L2bRencengHourly, GetShift3L2bRencengHourlyByDate, 
    GetShift3L2bTray, GetShift3L2bTrayHourly, GetShift3L2bTrayHourlyByDate, GetShift_L2b, GetShiftRenceng_L2b, GetShiftTray_L2b 
} from "../../../controllers/biscuit/line2/Line2bController.js";
import {
    getProsesEnroberByDate
} from "../../../controllers/biscuit/line2/ProsesEnroberController.js";

const app = Router();

app.get("/shift_l2b", GetShift_L2b);
app.get("/shift_renceng_l2b", GetShiftRenceng_L2b);
app.get("/shift_tray_l2b", GetShiftTray_L2b);

app.get("/packingrenceng_l2b", GetPackingRencengL2b);
app.get("/packingrenceng_l2b_all", GetPackingL2bRencengAll);
app.get("/packingtray_l2b", GetPackingTrayL2b);
app.get("/packingtray_l2b_all", GetPackingL2bTrayAll);

// Shift l5
app.get("/shift1renceng_l2b", GetShift1L2bRenceng);
app.get("/shift2renceng_l2b", GetShift2L2bRenceng);
app.get("/shift3renceng_l2b", GetShift3L2bRenceng);
app.get("/shift1tray_l2b", GetShift1L2bTray);
app.get("/shift2tray_l2b", GetShift2L2bTray);
app.get("/shift3tray_l2b", GetShift3L2bTray);
// ==== SHIFT HOURLY ====
app.get("/shift1renceng_l2b_hourly", GetShift1L2bRencengHourly);
app.get("/shift2renceng_l2b_hourly", GetShift2L2bRencengHourly);
app.get("/shift3renceng_l2b_hourly", GetShift3L2bRencengHourly);
app.get("/shift1tray_l2b_hourly", GetShift1L2bTrayHourly);
app.get("/shift2tray_l2b_hourly", GetShift2L2bTrayHourly);
app.get("/shift3tray_l2b_hourly", GetShift3L2bTrayHourly);
// ==== BY DATE ====
app.get("/shift3renceng_l2b_hourly/:date", GetShift3L2bRencengHourlyByDate);
app.get("/shift3tray_l2b_hourly/:date", GetShift3L2bTrayHourlyByDate);
// ==== Hourly & By Date ====
app.get("/packingrenceng_l2b_hourly", GetPackingL2bRencengHourly);
app.get("/packingrenceng_l2b_hourly/date/:date", GetPackingL2bRencengHourlyByDate);
app.get("/packingtray_l2b_hourly", GetPackingL2bTrayHourly);
app.get("/packingtray_l2b_hourly/date/:date", GetPackingL2bTrayHourlyByDate);
// ==== Daily & Weekly ====
app.get("/packingrenceng_l2b_daily", GetPackingL2bRencengDaily);
app.get("/packingrenceng_l2b_daily/date/:date", GetPackingL2bRencengDailyByDate);
app.get("/packingtray_l2b_daily", GetPackingL2bTrayDaily);
app.get("/packingtray_l2b_daily/date/:date", GetPackingL2bTrayDailyByDate);

app.get("/packingrenceng_l2b_weekly", GetPackingL2bRencengWeekly);
app.get("/packingrenceng_l2b_weekly/date/:date", GetPackingL2bRencengWeeklyByDate);
app.get("/packingtray_l2b_weekly", GetPackingL2bTrayWeekly);
app.get("/packingtray_l2b_weekly/date/:date", GetPackingL2bTrayWeeklyByDate);

// ==== PROSES ENROBER ====
app.get("/proses_enrober/2b/date", getProsesEnroberByDate);

export default app;
