// packingA2Routes.js
import { Router } from 'express';
import { 
    GetPackingA2, GetPackingA2All, GetPackingA2Counter, GetPackingA2Daily, 
    GetPackingA2DailyByDate, GetPackingA2Hourly, GetPackingA2HourlyByDate, 
    GetPackingA2Shift1, GetPackingA2Shift2, GetPackingA2Shift3, 
    GetPackingA2Weekly, GetPackingA2WeeklyByDate
} from '../../../../controllers/wafer/line1/packing/A2Controller.js';
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

// Ambil data terakhir
app.get('/packing_a2', GetPackingA2);
// Ambil semua data (yang graph = 'Y')
app.get('/packing_a2_all', GetPackingA2All);
// Ambil 7 data counter terakhir
app.get('/packing_a2_counter', GetPackingA2Counter);
// ==== Shift ===
app.get('/shift1_a2', GetPackingA2Shift1);
app.get('/shift2_a2', GetPackingA2Shift2);
app.get('/shift3_a2', GetPackingA2Shift3);
// ==== Hourly & with date parameters ====
app.get('/packing_a2_hourly', GetPackingA2Hourly);
app.get('/packing_a2_hourly/date/:date', GetPackingA2HourlyByDate);
// ==== Daily & Weekly ====
app.get('/packing_a2_daily', GetPackingA2Daily);
app.get('/packing_a2_daily/date/:date', GetPackingA2DailyByDate);
app.get('/packing_a2_weekly', GetPackingA2Weekly);
app.get('/packing_a2_weekly/date/:date', GetPackingA2WeeklyByDate);

export default app;