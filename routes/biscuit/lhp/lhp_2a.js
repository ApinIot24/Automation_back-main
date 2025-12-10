import { Router } from "express";
import { createLine2a, getLhpById, getLhpDailyByDate, getLhpDailyToday, getLine2aLast } from "../../../controllers/biscuit/lhp/Lhp2aController.js";
const app = Router();

app.post("/line2a", createLine2a);

app.get("/line2a", getLine2aLast);
app.get("/lhpl5/detail/:id", getLhpById);
app.get("/lhpl5_daily/:line", getLhpDailyToday);
app.get("/lhpl5_daily/date/:date/:line", getLhpDailyByDate);

export default app;