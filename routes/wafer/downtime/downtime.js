import { Router } from "express";
import { getDowntimeDailyRange, getDowntimeDailyRangeL5, getLastDowntimeL1 } from "../../../controllers/wafer/downtime/DowntimeController.js";
const app = Router();

app.get('/downtime_daily/range/:startDate/:endDate/:line', getDowntimeDailyRange);
app.get('/downtime_daily_l5/range/:startDate/:endDate/:line', getDowntimeDailyRangeL5);
app.get('/downtime_l1', getLastDowntimeL1);
export default app;