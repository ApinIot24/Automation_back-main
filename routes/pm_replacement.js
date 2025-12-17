import { Router } from "express";
import { getPmReplaceChecklistSubmitted, updatePmReplacementChecklist } from "../controllers/PmReplacementController.js";
// import { GetMachineByNameAndGroup, GetPmReplacementFilterAll, GetPmReplacementFiltered, GetPmReplacementListByGroupYear, GetPmReplacementQRCode, GetPmReplacementSelect } from "../controllers/PmReplacementController";

const app = Router();

// app.get("/pm_replacement/select/:group", GetPmReplacementSelect)
// app.get("/pm_replacement/qrcode/:group", GetPmReplacementQRCode)
app.get("/pm_replacement/:group/:year", getPmReplaceChecklistSubmitted)

app.put("/pm_replacement/:id", updatePmReplacementChecklist);
// // app.post("/pm_replacement/machine", GetMachineByNameAndGroup)
// app.get("/pm_replacement/filter/:group/:year/:week", GetPmReplacementFiltered)
// app.get("/pm_replacement/filter/all/:group/:year/:week", GetPmReplacementFilterAll)

export default app;