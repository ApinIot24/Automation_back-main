
import { Router } from 'express';
import { 
    GetPackingL6, GetPackingL6All, GetPackingL6Daily, GetPackingL6DailyByDate, 
    GetPackingL6Hourly, GetPackingL6HourlyByDate, GetPackingL6Weekly, 
    GetPackingL6WeeklyByDate, GetShift1L6, GetShift1L6Hourly, GetShift2L6, 
    GetShift2L6Hourly, GetShift3L6, GetShift3L6Hourly, GetShift_L6 
} from '../../../controllers/wafer/line6/Line6Controller.js';

const app = Router();
// ===================== ROUTES =====================
// ==== BASIC PACKING L6 ====
app.get('/packing_l6', GetPackingL6);
app.get('/packing_l6_all', GetPackingL6All);
app.get('/shift_l6', GetShift_L6);
// ==== SHIFT ====
app.get('/shift1_l6', GetShift1L6);
app.get('/shift2_l6', GetShift2L6);
app.get('/shift3_l6', GetShift3L6);
// ==== SHIFT HOURLY ====
app.get('/shift1_l6_hourly', GetShift1L6Hourly);
app.get('/shift2_l6_hourly', GetShift2L6Hourly);
app.get('/shift3_l6_hourly', GetShift3L6Hourly);
// ==== HOURLY & BY DATE ====
app.get('/packing_l6_hourly', GetPackingL6Hourly);
app.get('/packing_l6_hourly/date/:date', GetPackingL6HourlyByDate);
app.get('/packing_l6_daily', GetPackingL6Daily);
app.get('/packing_l6_daily/date/:date', GetPackingL6DailyByDate);
app.get('/packing_l6_weekly', GetPackingL6Weekly);
app.get('/packing_l6_weekly/date/:date', GetPackingL6WeeklyByDate);

export default app;