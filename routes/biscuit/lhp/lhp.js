import { Router } from "express";
import { createLhpL5, getLatestLhpL5, getLhpL5Daily, getLhpL5DailyByDate, getLhpL5Detail } from "../../../controllers/biscuit/lhp/LhpController.js";
const app = Router();

app.post("/lhpl5", createLhpL5);

app.get("/lhpl5", getLatestLhpL5);
app.get("/lhpl5/detail/:id", getLhpL5Detail);
app.get("/lhpl5_daily/:line", getLhpL5Daily);

app.get("/lhpl5_daily/date/:date/:line", getLhpL5DailyByDate);

export default app;