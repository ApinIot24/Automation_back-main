// packingB3Routes.js
import { Router } from 'express';
import { 
  GetPackingB3, GetPackingB3All, GetPackingB3Counter, GetPackingB3Daily, 
  GetPackingB3DailyByDate, GetPackingB3Hourly, GetPackingB3HourlyByDate, 
  GetPackingB3Shift1, GetPackingB3Shift2, GetPackingB3Shift3, 
  GetPackingB3Weekly, GetPackingB3WeeklyByDate 
} from '../../../../controllers/wafer/line2/packing/B3Controller.js';

const app = Router();

/**
 * Middleware untuk memastikan koneksi DB tersedia di req.db_iot
 */
// app.use((req, res, next) => {
//   if (!req.db_iot) {
//     return res.status(500).json({ error: 'Database connection not available' });
//   }
//   next();
// });

// ===================== ROUTES =====================
// packing_b3 (data terakhir)
app.get('/packing_b3', GetPackingB3);
// packing_b3_all (graph = 'Y')
app.get('/packing_b3_all', GetPackingB3All);
// packing_b3_counter (7 data terakhir)
app.get('/packing_b3_counter', GetPackingB3Counter);
// ==== SHIFT ====
app.get('/shift1_b3', GetPackingB3Shift1);
app.get('/shift2_b3', GetPackingB3Shift2);
app.get('/shift3_b3', GetPackingB3Shift3);
// ==== HOURLY & BY DATE ====
app.get('/packing_b3_hourly', GetPackingB3Hourly);
app.get('/packing_b3_hourly/date/:date', GetPackingB3HourlyByDate);
// ==== DAILY & WEEKLY ====
app.get('/packing_b3_daily', GetPackingB3Daily);
app.get('/packing_b3_daily/date/:date', GetPackingB3DailyByDate);
app.get('/packing_b3_weekly', GetPackingB3Weekly);
app.get('/packing_b3_weekly/date/:date', GetPackingB3WeeklyByDate);

export default app;
