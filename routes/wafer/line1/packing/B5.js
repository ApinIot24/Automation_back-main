// packingB5Routes.js
import { Router } from 'express';
import { 
  GetPackingB5, GetPackingB5All, GetPackingB5Counter, GetPackingB5Daily, 
  GetPackingB5DailyByDate, GetPackingB5Hourly, GetPackingB5HourlyByDate, 
  GetPackingB5Shift1, GetPackingB5Shift2, GetPackingB5Shift3, 
  GetPackingB5Weekly, GetPackingB5WeeklyByDate 
} from '../../../../controllers/wafer/line1/packing/B5Controller.js';

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
app.get('/packing_b5', GetPackingB5);
// Ambil semua data (graph = 'Y')
app.get('/packing_b5_all', GetPackingB5All);
// Ambil 7 data counter terakhir
app.get('/packing_b5_counter', GetPackingB5Counter);
// ==== SHIFT ====
app.get('/shift1_b5', GetPackingB5Shift1)
app.get('/shift2_b5', GetPackingB5Shift2)
app.get('/shift3_b5', GetPackingB5Shift3);
// ==== Hourly & with date parameters ====
app.get('/packing_b5_hourly', GetPackingB5Hourly)
app.get('/packing_b5_hourly/date/:date', GetPackingB5HourlyByDate);
// ==== Daily & Weekly ====
app.get('/packing_b5_daily', GetPackingB5Daily)
app.get('/packing_b5_daily/date/:date', GetPackingB5DailyByDate)
app.get('/packing_b5_weekly', GetPackingB5Weekly)
app.get('/packing_b5_weekly/date/:date', GetPackingB5WeeklyByDate);

export default app;
