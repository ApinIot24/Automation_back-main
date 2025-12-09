import { Router } from "express";
import { getLoadcellProcessedV2, PostLoadcellProcessedV2 } from "../../../controllers/biscuit/line5/BiscuitCk3V2Controller.js";
const app = Router();

app.post("/ck_biscuit/loadcell/v2/processed", PostLoadcellProcessedV2);
app.get("/ck_biscuit/loadcell/v2/processed", getLoadcellProcessedV2);


export default app;