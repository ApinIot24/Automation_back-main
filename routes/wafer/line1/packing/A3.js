// packingA3Routes.js
import { Router } from 'express';
import { GetPackingA3, GetPackingA3All, GetPackingA3Counter, GetPackingA3Daily, GetPackingA3DailyByDate, GetPackingA3Hourly, GetPackingA3HourlyByDate, GetPackingA3Shift1, GetPackingA3Shift2, GetPackingA3Shift3, GetPackingA3Weekly, GetPackingA3WeeklyByDate } from '../../../../controllers/wafer/line1/packing/A3Controller.js';

const app = Router();

/**
 * Middleware untuk memastikan koneksi database ada di req.db
 */
// app.use((req, res, next) => {
//   if (!req.db) {
//     return res.status(500).json({ error: 'Database connection not available' });
//   }
//   next();
// });

// ===================== ROUTES =====================

// Ambil data terakhir
app.get('/packing_a3', GetPackingA3);
// Ambil semua data (graph = 'Y')
app.get('/packing_a3_all', GetPackingA3All);
// Ambil 7 data counter terakhir
app.get('/packing_a3_counter', GetPackingA3Counter);
// ==== SHIFT ====
app.get('/shift1_a3', GetPackingA3Shift1);
app.get('/shift2_a3', GetPackingA3Shift2);
app.get('/shift3_a3', GetPackingA3Shift3);
// ==== Hourly & with date parameters ====
app.get('/packing_a3_hourly', GetPackingA3Hourly)
app.get('/packing_a3_hourly/date/:date', GetPackingA3HourlyByDate);
// ==== Daily & Weekly ====
app.get('/packing_a3_daily', GetPackingA3Daily);
app.get('/packing_a3_daily/date/:date', GetPackingA3DailyByDate)
app.get('/packing_a3_weekly', GetPackingA3Weekly);
app.get('/packing_a3_weekly/date/:date', GetPackingA3WeeklyByDate);

export default app;
