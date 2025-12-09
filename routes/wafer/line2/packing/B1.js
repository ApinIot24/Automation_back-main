// packingB1Routes.js
import { Router } from 'express';
import { GetPackingB1, GetPackingB1All, GetPackingB1Counter, GetPackingB1Daily, GetPackingB1DailyByDate, GetPackingB1Hourly, GetPackingB1HourlyByDate, GetPackingB1Shift1, GetPackingB1Shift2, GetPackingB1Shift3, GetPackingB1Weekly, GetPackingB1WeeklyByDate } from '../../../../controllers/wafer/line2/packing/B1Controller.js';
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

// packing_b1 (data terakhir)
app.get('/packing_b1', GetPackingB1);
// packing_b1_all (graph = 'Y')
app.get('/packing_b1_all', GetPackingB1All);
// packing_b1_counter (7 data terakhir)
app.get('/packing_b1_counter', GetPackingB1Counter);
// ==== SHIFT ====
app.get('/shift1_b1', GetPackingB1Shift1);
app.get('/shift2_b1', GetPackingB1Shift2);
app.get('/shift3_b1', GetPackingB1Shift3);
// ==== Hourly & By Date ====
app.get('/packing_b1_hourly', GetPackingB1Hourly);
app.get('/packing_b1_hourly/date/:date', GetPackingB1HourlyByDate);
// ==== Daily & Weekly ====
app.get('/packing_b1_daily', GetPackingB1Daily);
app.get('/packing_b1_daily/date/:date', GetPackingB1DailyByDate);
app.get('/packing_b1_weekly', GetPackingB1Weekly);
app.get('/packing_b1_weekly/date/:date', GetPackingB1WeeklyByDate);

export default app;
