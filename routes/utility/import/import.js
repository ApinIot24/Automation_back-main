import { Router } from "express";
import multer from "multer";
import { addPmUtility, deleteAllPmUtility, deleteUtilityBatch, deleteUtilityByGroup, getMachinePMListUtilityByGroup, getMachineUtilityByName, getPmUtilityWithWeeklyByYear, getQrCodeUtilityListByGroup, updateMachineUtilityList, updatePmUtilityField } from "../../../controllers/utility/import/pmUtilityController.js";
import { importUtility, importUtilityByGroup } from "../../../controllers/utility/import/importController.js";
import { deleteChecklistUtilityByWeek, getChecklistUtilityAll, getChecklistUtilityCount, getChecklistUtilityData, getChecklistUtilityRange, getChecklistUtilitySubmitted, submitChecklistWeekUtilityByGroup, updateChecklistUtility } from "../../../controllers/utility/import/pmChecklistController.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.get("/pm_utility/select/:group", getMachinePMListUtilityByGroup);
router.get("/pm_utility/qrcode/:group", getQrCodeUtilityListByGroup);
router.get("/pm_utility/:group/:year", getPmUtilityWithWeeklyByYear);

router.post("/pm_utility/machine", getMachineUtilityByName);

router.get("/pm_utility/filter/checklist/data/:group/:year/:week", getChecklistUtilityData);
router.get("/pm_utility/filter/checklist/:group/:year/:week", getChecklistUtilitySubmitted);
router.get("/pm_utility/filter/:group/:year/:week", getChecklistUtilityRange);
router.get("/pm_utility/filter/all/:group/:year/:week", getChecklistUtilityAll);
router.get("/pm_utility/filter/length/:group/:year/:week", getChecklistUtilityCount);

router.post("/pm_utility/submit_pm_checklist/:grup", submitChecklistWeekUtilityByGroup)
router.post("/pm_utility/add_utility", addPmUtility);
router.put("/pm_utility/checklist/:id", updateChecklistUtility);
router.delete("/pm_utility/checklist/:week/:grup", deleteChecklistUtilityByWeek);

router.put("/pm_utility/list/machine/update", updateMachineUtilityList);
router.put("/pm_utility/update_field/:id", updatePmUtilityField);

// Endpoint API
router.post("/import/utility", upload.single("file"), importUtility);
router.post("/import/utility/:grup", importUtilityByGroup);

router.delete("/deleted/utility/:group", deleteUtilityByGroup);
router.delete("/deleted/utility_pm/batch", deleteUtilityBatch);
router.delete("/delete_all_utility", deleteAllPmUtility);

export default router;
