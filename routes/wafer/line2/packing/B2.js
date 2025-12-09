// packingB2Routes.js
import { Router } from 'express';
import { 
  GetPackingB2, GetPackingB2All, GetPackingB2Counter, GetPackingB2Daily, 
  GetPackingB2DailyByDate, GetPackingB2Hourly, GetPackingB2HourlyByDate, 
  GetPackingB2Shift1, GetPackingB2Shift2, GetPackingB2Shift3, 
  GetPackingB2Weekly, GetPackingB2WeeklyByDate 
} from '../../../../controllers/wafer/line2/packing/B2Controller.js';

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

// packing_b2 (data terakhir)
app.get('/packing_b2', GetPackingB2);
// packing_b2_all (graph = 'Y')
app.get('/packing_b2_all', GetPackingB2All);
// packing_b2_counter (7 data terakhir)
app.get('/packing_b2_counter', GetPackingB2Counter);
// ==== SHIFT ====
app.get('/shift1_b2', GetPackingB2Shift1);
app.get('/shift2_b2', GetPackingB2Shift2);
app.get('/shift3_b2', GetPackingB2Shift3);
// ==== Hourly & By Date ====
app.get('/packing_b2_hourly', GetPackingB2Hourly);
app.get('/packing_b2_hourly/date/:date', GetPackingB2HourlyByDate);
// ==== Daily & Weekly ====
app.get('/packing_b2_daily', GetPackingB2Daily);
app.get('/packing_b2_daily/date/:date', GetPackingB2DailyByDate);
app.get('/packing_b2_weekly', GetPackingB2Weekly);
app.get('/packing_b2_weekly/date/:date', GetPackingB2WeeklyByDate);

export default app;
