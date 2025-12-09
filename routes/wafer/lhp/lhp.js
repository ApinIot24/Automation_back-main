import { Router } from "express";
import { createLHP, createLHPL7, getDailyLHP, getDailyLHPByDate, getLastLHP, getLHPDetail } from "../../../controllers/wafer/lhp/LhpController.js";
const app = Router();

app.post("/lhp", createLHP);
app.get("/lhp", getLastLHP);
app.get("/lhp/detail/:id", getLHPDetail);
app.get("/lhp_daily/:line", getDailyLHP);

app.get("/lhp_daily/date/:date/:line", getDailyLHPByDate);

app.post("/lhpl7", createLHPL7);

export default app;
