// packingA4Routes.js
import { Router } from 'express';
import { 
  GetPackingA4, GetPackingA4All, GetPackingA4Counter, GetPackingA4Daily, 
  GetPackingA4DailyByDate, GetPackingA4Hourly, GetPackingA4HourlyByDate, 
  GetPackingA4Shift1, GetPackingA4Shift2, GetPackingA4Shift3, GetPackingA4Weekly, 
  GetPackingA4WeeklyByDate 
} from '../../../../controllers/wafer/line2/packing/A4Controller.js';

const app = Router();

/**
 * Middleware untuk memastikan koneksi database ada di req.db_iot
 */
// app.use((req, res, next) => {
//   if (!req.db_iot) {
//     return res.status(500).json({ error: 'Database connection not available' });
//   }
//   next();
// });

// ===================== ROUTES =====================

app.get('/packing_a4', GetPackingA4);
app.get('/packing_a4_all', GetPackingA4All);
app.get('/packing_a4_counter', GetPackingA4Counter);
// ==== SHIFT ====
app.get('/shift1_a4', GetPackingA4Shift1);
app.get('/shift2_a4', GetPackingA4Shift2);
app.get('/shift3_a4', GetPackingA4Shift3);
// ==== Hourly ====
app.get('/packing_a4_hourly', GetPackingA4Hourly);
app.get('/packing_a4_hourly/date/:date', GetPackingA4HourlyByDate);
// ==== Daily & Weekly ====
app.get('/packing_a4_daily', GetPackingA4Daily)
app.get('/packing_a4_daily/date/:date',GetPackingA4DailyByDate);
app.get('/packing_a4_weekly', GetPackingA4Weekly);
app.get('/packing_a4_weekly/date/:date', GetPackingA4WeeklyByDate);

export default app;
