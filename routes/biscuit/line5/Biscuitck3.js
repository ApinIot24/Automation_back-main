import { Router } from "express";
import { GetCkBiskuitLoadcell, PostProcessedLoadcell } from "../../../controllers/biscuit/line5/BiscuitCk3Controller.js";
const app = Router();

app.post("/ck_biscuit/loadcell/processed", PostProcessedLoadcell);

app.get("/ck_biscuit/loadcell/processed/:database/:startdate/:enddate", GetCkBiskuitLoadcell);

export default app;
