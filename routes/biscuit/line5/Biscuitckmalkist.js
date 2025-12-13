import { Router } from "express";
import { GetCkBiskuitLoadcell, PostProcessedLoadcell } from "../../../controllers/biscuit/line5/BiscuitMalkistController.js";
const app = Router();

app.post("/ck_malkist/loadcell/processed", PostProcessedLoadcell);

app.get("/ck_malkist/loadcell/processed/:database/:startdate/:enddate", GetCkBiskuitLoadcell);

export default app;
