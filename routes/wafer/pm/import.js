import { Router } from "express";
import multer from "multer";
import { AddWafer, DeleteWaferAll, DeleteWaferBatch, DeleteWaferByGroup, ImportWafer, ImportWaferByGroup, UpdateMachineListOrder, UpdateWaferField } from "../../../controllers/wafer/pm/PmController.js";
import { GetMachineByNameAndGroup, GetWaferFilterAll, GetWaferFiltered, GetWaferListByGroupYear, GetWaferQRCode, GetWaferSelect } from "../../../controllers/wafer/pm/BasePmController.js";
import { DeleteChecklistPM, GetChecklistDataFull, GetChecklistFilteredData, GetChecklistLength, SubmitChecklistPM, UpdateChecklistPM } from "../../../controllers/wafer/pm/ChecklistPmController.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.get("/pm_wafer/select/:group", GetWaferSelect);
router.get("/pm_wafer/qrcode/:group", GetWaferQRCode);
router.get("/pm_wafer/:group/:year",GetWaferListByGroupYear);

router.post("/pm_wafer/machine", GetMachineByNameAndGroup);
router.get("/pm_wafer/filter/:group/:year/:week", GetWaferFiltered);
router.get("/pm_wafer/filter/all/:group/:year/:week", GetWaferFilterAll);

// router.get("/pm_wafer/:group/:year", async (req, res) => {
//   try {
//     const group = parseInt(req.params.group, 10);
//     const year = parseInt(req.params.year, 10); // Tahun target (misalnya, 2024)

//     // Mengambil parameter 'start' dan 'end' dari query string
//     const { start = 0, end = 20 } = req.query;

//     // Pastikan 'start' dan 'end' adalah angka dan valid
//     const startIndex = parseInt(start, 10);
//     const endIndex = parseInt(end, 10);

//     if (isNaN(startIndex) || isNaN(endIndex)) {
//       return res.status(400).json({ error: "Invalid pagination parameters" });
//     }

//     // Query dengan pembatasan hasil berdasarkan start dan end
//     const result = await req.db.query(
//       "SELECT * FROM automation.pm_wafer WHERE grup = $1 ORDER BY CAST(no AS INTEGER) ASC LIMIT $2 OFFSET $3",
//       [group, endIndex - startIndex, startIndex]
//     );

//     const totalWeeks = getTotalWeeksInYear(year);

//     const modifiedData = result.rows.map((row) => ({
//       ...row,
//       week: generateWeeklyDataForTargetYear(
//         totalWeeks,
//         row.periode,
//         row.periode_start,
//         year
//       ),
//     }));

//     res.json(modifiedData);
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     res.status(500).json({ error: "Error fetching data" });
//   }
// });

router.get("/pm_wafer/filter/checklist/data/:group/:year/:week", GetChecklistFilteredData);
router.get("/pm_wafer/filter/checklist/:group/:year/:week", GetChecklistDataFull);
router.get("/pm_wafer/filter/length/:group/:year/:week", GetChecklistLength);

router.post("/pm_wafer/submit_pm_checklist/:grup", SubmitChecklistPM);
router.post("/pm_wafer/add_wafer", AddWafer);
router.put("/pm_wafer/checklist/:id", UpdateChecklistPM);
router.delete("/pm_wafer/checklist/:week/:grup", DeleteChecklistPM);
router.put("/pm_wafer/list/machine/update", UpdateMachineListOrder);
router.put("/pm_wafer/update_field/:id", UpdateWaferField);

// Endpoint API
router.post("/import/wafer", upload.single("file"), ImportWafer);

router.post("/import/wafer/:grup", upload.single("file"), ImportWaferByGroup);

router.delete("/deleted/wafer/:group", DeleteWaferByGroup);

router.delete("/deleted/wafer_pm/batch", DeleteWaferBatch);

router.delete("/delete_all_wafer", DeleteWaferAll);
export default router;