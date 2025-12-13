import { Router } from "express";
import multer from "multer";
import { importBiscuit, importBiscuitByGroup } from "../../../controllers/biscuit/import/importController.js";
import { addPmBiscuit, deleteAllPmBiscuit, deleteBatch, deleteByGroup, getMachineByName, getMachineListByGroup, getPmBiscuitWithWeeklyByYear, getQrCodeListByGroup, updateMachineList, updatePmBiscuitField } from "../../../controllers/biscuit/import/pmBiscuitController.js";
import { deleteChecklistByWeek, getChecklistAll, getChecklistCount, getChecklistData, getChecklistRange, getChecklistSubmitted, submitChecklistWeekByGroup, updateChecklist } from "../../../controllers/biscuit/import/pmChecklistController.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.get("/pm_biscuit/select/:group", getMachineListByGroup);
router.get("/pm_biscuit/qrcode/:group", getQrCodeListByGroup);
router.get("/pm_biscuit/:group/:year", getPmBiscuitWithWeeklyByYear);
// Router ini fungsinya get (entah dipakai atau tidak)
router.post("/pm_biscuit/machine", getMachineByName);

router.get( "/pm_biscuit/filter/checklist/data/:group/:year/:week", getChecklistData);
router.get("/pm_biscuit/filter/checklist/:group/:year/:week", getChecklistSubmitted);
router.get("/pm_biscuit/filter/:group/:year/:week", getChecklistRange);
router.get("/pm_biscuit/filter/all/:group/:year/:week", getChecklistAll);
router.get("/pm_biscuit/filter/length/:group/:year/:week", getChecklistCount);

router.post("/pm_biscuit/submit_pm_checklist/:grup", submitChecklistWeekByGroup);
router.post("/pm_biscuit/add_biscuit", addPmBiscuit);

router.put("/pm_biscuit/checklist/:id", updateChecklist);
router.delete("/pm_biscuit/checklist/:week/:grup", deleteChecklistByWeek);
router.put("/pm_biscuit/list/machine/update", updateMachineList);
router.put("/pm_biscuit/update_field/:id", updatePmBiscuitField);

// Endpoint API
router.post("/import/biscuit", upload.single("file"), importBiscuit);

router.post("/import/biscuit/:grup", upload.single("file"), importBiscuitByGroup);

router.delete("/deleted/biscuit/:group", deleteByGroup);

router.delete("/deleted/biscuit_pm/batch", deleteBatch);

router.delete("/delete_all_biscuit", deleteAllPmBiscuit);
export default router;