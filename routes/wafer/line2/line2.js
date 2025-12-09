import { Router } from 'express';
import A4 from './packing/A4.js';
import B1 from './packing/B1.js';
import B2 from './packing/B2.js';
import B3 from './packing/B3.js';
import B4 from './packing/B4.js';
import { GetPackingL2, GetPackingL2All, GetPackingL2Daily, GetPackingL2DailyByDate, GetPackingL2Hourly, GetPackingL2HourlyByDate, GetPackingL2Weekly, GetPackingL2WeeklyByDate, GetShift1L2, GetShift1L2Hourly, GetShift2L2, GetShift2L2Hourly, GetShift3L2, GetShift3L2Hourly, GetShift_L2 } from '../../../controllers/wafer/line2/Line2Controller.js';

const app = Router();

//line2
app.get('/packing_l2', GetPackingL2);
app.get('/shift_l2', GetShift_L2);
// SHIFT L2
app.get('/shift1_l2', GetShift1L2);
app.get('/shift2_l2', GetShift2L2);
app.get('/shift3_l2', GetShift3L2);
// Shift L2 Hourly
app.get('/shift1_l2_hourly', GetShift1L2Hourly);
app.get('/shift2_l2_hourly', GetShift2L2Hourly);
app.get('/shift3_l2_hourly', GetShift3L2Hourly);

app.get('/packing_l2_all', GetPackingL2All);
app.get('/packing_l2_hourly', GetPackingL2Hourly);
app.get('/packing_l2_hourly/date/:date', GetPackingL2HourlyByDate);
app.get('/packing_l2_daily', GetPackingL2Daily);
app.get('/packing_l2_daily/date/:date', GetPackingL2DailyByDate);
app.get('/packing_l2_weekly', GetPackingL2Weekly);
app.get('/packing_l2_weekly/date/:date', GetPackingL2WeeklyByDate);

app.use('/', A4);
app.use('/', B1);
app.use('/', B2);
app.use('/', B3);
app.use('/', B4);

export default app;
