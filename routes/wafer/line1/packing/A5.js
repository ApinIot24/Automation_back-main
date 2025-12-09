// packingA5Routes.js
import { Router } from 'express'
import { 
  GetPackingA5, GetPackingA5All, GetPackingA5Counter, GetPackingA5Daily, 
  GetPackingA5DailyByDate, GetPackingA5Hourly, GetPackingA5HourlyByDate, 
  GetPackingA5Shift1, GetPackingA5Shift2, GetPackingA5Shift3, GetPackingA5Weekly, 
  GetPackingA5WeeklyByDate } 
from '../../../../controllers/wafer/line1/packing/A5Controlller.js'
const app = Router()

/**
 * Middleware untuk memastikan koneksi database ada di req.db_iot
 */
// app.use((req, res, next) => {
//   if (!req.db_iot) {
//     return res.status(500).json({ error: 'Database connection not available' })
//   }
//   next()
// })

// ===================== ROUTES =====================
// Ambil data terakhir
app.get('/packing_a5', GetPackingA5)
// Ambil semua data (graph = 'Y')
app.get('/packing_a5_all', GetPackingA5All)
// Ambil 7 data counter terakhir
app.get('/packing_a5_counter', GetPackingA5Counter)
// ==== SHIFT ====
app.get('/shift1_a5', GetPackingA5Shift1)
app.get('/shift2_a5', GetPackingA5Shift2)
app.get('/shift3_a5', GetPackingA5Shift3)
// ==== Hourly & with date parameters ====
app.get('/packing_a5_hourly', GetPackingA5Hourly)
app.get('/packing_a5_hourly/date/:date', GetPackingA5HourlyByDate)
// ==== Daily & Weekly ====
app.get('/packing_a5_daily', GetPackingA5Daily)
app.get('/packing_a5_daily/date/:date', GetPackingA5DailyByDate)
app.get('/packing_a5_weekly', GetPackingA5Weekly)
app.get('/packing_a5_weekly/date/:date', GetPackingA5WeeklyByDate)

export default app
