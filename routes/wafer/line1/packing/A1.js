// packingA1Routes.js
import { Router } from 'express';
import { 
  GetPackingA1, GetPackingA1All, GetPackingA1Counter, GetPackingA1Daily, 
  GetPackingA1DailyByDate, GetPackingA1Hourly, GetPackingA1HourlyByDate, 
  GetPackingA1Shift1, GetPackingA1Shift2, GetPackingA1Shift3, 
  GetPackingA1Weekly, GetPackingA1WeeklyByDate 
} from '../../../../controllers/wafer/line1/packing/A1Controller.js';

const app = Router();

/**
 * Middleware untuk memeriksa koneksi database
 * Pastikan req.db_iot telah disiapkan sebelum router ini digunakan
 */
// app.use((req, res, next) => {
//   if (!req.db_iot) {
//     return res.status(500).json({ error: 'Database connection not available' });
//   }
//   next();
// });

// ===================== ROUTES =====================

// Ambil data terakhir
app.get('/packing_a1', GetPackingA1);
// Ambil semua data (yang graph = 'Y')
app.get('/packing_a1_all', GetPackingA1All);
// Ambil 7 data counter terakhir
app.get('/packing_a1_counter', GetPackingA1Counter);
// by Shift
app.get('/shift1_a1', GetPackingA1Shift1);
app.get('/shift2_a1', GetPackingA1Shift2);
app.get('/shift3_a1', GetPackingA1Shift3);
// Hourly & with date parameters
app.get('/packing_a1_hourly', GetPackingA1Hourly);
app.get('/packing_a1_hourly/date/:date', GetPackingA1HourlyByDate);
// ==== Daily & Weekly ====
app.get('/packing_a1_daily', GetPackingA1Daily);
app.get('/packing_a1_daily/date/:date', GetPackingA1DailyByDate);
app.get('/packing_a1_weekly', GetPackingA1Weekly);
app.get('/packing_a1_weekly/date/:date', GetPackingA1WeeklyByDate);

export default app;