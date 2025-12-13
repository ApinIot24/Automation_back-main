import { Router } from "express";
import multer from "multer";
import { addPmAstor, deleteAllPmAstor, deleteAstorBatch, deleteAstorByGroup, getMachineAstorByName, getMachineAstorListByGroup, getPmAstorWithWeeklyByYear, getQrCodeAstorListByGroup, updateMachineAstorList, updatePmAstorField } from "../../../controllers/astor/import/pmAstorController.js";
import { importAstor, importAstorByGroup } from "../../../controllers/astor/import/importController.js";
import { deleteChecklistAstorByWeek, getChecklistAstorAll, getChecklistAstorCount, getChecklistAstorData, getChecklistAstorRange, getChecklistAstorSubmitted, submitChecklistWeekAstorByGroup, updateChecklistAstor } from "../../../controllers/astor/import/pmChecklistController.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.get("/pm_astor/select/:group", getMachineAstorListByGroup);
router.get("/pm_astor/qrcode/:group", getQrCodeAstorListByGroup);
router.get("/pm_astor/:group/:year", getPmAstorWithWeeklyByYear);

router.post("/pm_astor/machine", getMachineAstorByName);

router.get("/pm_astor/filter/checklist/data/:group/:year/:week", getChecklistAstorData);
router.get("/pm_astor/filter/checklist/:group/:year/:week", getChecklistAstorSubmitted);
router.get("/pm_astor/filter/:group/:year/:week", getChecklistAstorRange);
router.get("/pm_astor/filter/all/:group/:year/:week", getChecklistAstorAll);
router.get("/pm_astor/filter/length/:group/:year/:week", getChecklistAstorCount);

router.post("/pm_astor/submit_pm_checklist/:grup", submitChecklistWeekAstorByGroup);
router.post("/pm_astor/add_astor", addPmAstor);

router.put("/pm_astor/checklist/:id", updateChecklistAstor);
router.delete("/pm_astor/checklist/:week/:grup", deleteChecklistAstorByWeek);
router.put("/pm_astor/list/machine/update", updateMachineAstorList);
router.put("/pm_astor/update_field/:id", updatePmAstorField);

// Endpoint API
router.post("/import/astor", upload.single("file"), importAstor);
router.post("/import/astor/:grup", upload.single("file"), importAstorByGroup);

router.delete("/deleted/astor/:group", deleteAstorByGroup);
router.delete("/deleted/astor_pm/batch", deleteAstorBatch);
router.delete("/delete_all_astor", deleteAllPmAstor);
export default router;