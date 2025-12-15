import { Router } from "express";
import { getChecklistByLineWeek, getChecklistByQRCode, updateChecklist } from "../controllers/ChecklistController.js";

const app = Router();
app.get("/mobile/current/week/:line/:currentweek", getChecklistByLineWeek);
// Mendapatkan data melalui query parameter
app.get("/qrchecklist/checklist/get", getChecklistByQRCode);
app.put("/qrchecklist/checklist/put", updateChecklist);


export default app;