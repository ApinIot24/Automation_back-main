import { Router } from "express";
import multer from "multer";
import { addPmChoki, deleteAllPmChoki, deleteChokiBatch, deleteChokiByGroup, getMachineChokiByName, getMachineChokiListByGroup, getPmChokiWithWeeklyByYear, getQrCodeChokiListByGroup, updateMachineChokiList, updatePmChokiField } from "../../../controllers/choki/import/pmChokiController.js";
import { importChoki, importChokiByGroup } from "../../../controllers/choki/import/importController.js";
import { deleteChecklistChokiByWeek, getChecklistChokiAll, getChecklistChokiCount, getChecklistChokiData, getChecklistChokiRange, getChecklistChokiSubmitted, submitChecklistWeekChokiByGroup, updateChecklistChoki } from "../../../controllers/choki/import/pmChecklistController.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.get("/pm_choki/select/:group", getMachineChokiListByGroup);
router.get("/pm_choki/qrcode/:group", getQrCodeChokiListByGroup);
router.get("/pm_choki/:group/:year", getPmChokiWithWeeklyByYear);

router.post("/pm_choki/machine", getMachineChokiByName);

router.get("/pm_choki/filter/checklist/data/:group/:year/:week", getChecklistChokiData);
router.get("/pm_choki/filter/checklist/:group/:year/:week", getChecklistChokiSubmitted);
router.get("/pm_choki/filter/:group/:year/:week", getChecklistChokiRange);
router.get("/pm_choki/filter/all/:group/:year/:week", getChecklistChokiAll);
router.get("/pm_choki/filter/length/:group/:year/:week", getChecklistChokiCount);

router.post("/pm_choki/submit_pm_checklist/:grup", submitChecklistWeekChokiByGroup);
router.post("/pm_choki/add_choki", addPmChoki);

router.put("/pm_choki/checklist/:id", updateChecklistChoki);
router.delete("/pm_choki/checklist/:week/:grup", deleteChecklistChokiByWeek);
router.put("/pm_choki/list/machine/update", updateMachineChokiList);
router.put("/pm_choki/update_field/:id", updatePmChokiField);

// Endpoint API
router.post("/import/choki", upload.single("file"), importChoki);
router.post("/import/choki/:grup", upload.single("file"), importChokiByGroup);

router.delete("/deleted/choki/:group", deleteChokiByGroup);
router.delete("/deleted/choki_pm/batch", deleteChokiBatch);
router.delete("/delete_all_choki", deleteAllPmChoki);
export default router;