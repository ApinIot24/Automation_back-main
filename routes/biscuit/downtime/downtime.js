import { getDowntimeDailyRange } from "../../../controllers/biscuit/downtime/DowntimeController.js";

import { Router } from "express";
const app = Router();

app.get('/downtime_daily_l5/range/:startDate/:endDate/:line', getDowntimeDailyRange);
export default app;
