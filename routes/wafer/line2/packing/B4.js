// packingB4Routes.js
import { Router } from 'express';
import { 
  GetPackingB4, GetPackingB4All, GetPackingB4Counter, GetPackingB4Daily, 
  GetPackingB4DailyByDate, GetPackingB4Hourly, GetPackingB4HourlyByDate, 
  GetPackingB4Shift1, GetPackingB4Shift2, GetPackingB4Shift3, GetPackingB4Weekly, 
  GetPackingB4WeeklyByDate 
} from '../../../../controllers/wafer/line2/packing/B4Controller.js';

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
// packing_b4 (data terakhir)
app.get('/packing_b4', GetPackingB4);
// packing_b4_all (graph = 'Y')
app.get('/packing_b4_all', GetPackingB4All);
// packing_b4_counter (7 data terakhir)
app.get('/packing_b4_counter', GetPackingB4Counter);
// ==== SHIFT ====
app.get('/shift1_b4', GetPackingB4Shift1);
app.get('/shift2_b4', GetPackingB4Shift2);
app.get('/shift3_b4', GetPackingB4Shift3);
// ==== HOURLY & BY DATE ====
app.get('/packing_b4_hourly', GetPackingB4Hourly);
app.get('/packing_b4_hourly/date/:date', GetPackingB4HourlyByDate);
// ==== DAILY & WEEKLY ====
app.get('/packing_b4_daily', GetPackingB4Daily);
app.get('/packing_b4_daily/date/:date', GetPackingB4DailyByDate);
app.get('/packing_b4_weekly', GetPackingB4Weekly);
app.get('/packing_b4_weekly/date/:date', GetPackingB4WeeklyByDate);

export default app;
