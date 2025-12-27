import { Router } from "express";
import { getMasterGdspData, updateMasterGdspData, softDeleteMasterGdsp } from "../../controllers/gdsp/master_gdsp/MasterGdspController.js";
import { createHistoryGdsp, getHistoryGdsp, getHistoryGdspById, updateHistoryGdsp } from "../../controllers/gdsp/master_gdsp/HistoryCrudMasterController.js";
// middlewares/uploadExcel.js
import multer from "multer";
import path from "path";
import { importHistoryGdsp, importMasterGdsp } from "../../controllers/gdsp/master_gdsp/ImportMasterController.js";
import { exportHistoryGdsp } from "../../controllers/gdsp/master_gdsp/ExportMasterController.js";

const app = Router()

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".xls" && ext !== ".xlsx") {
        return cb(new Error("Only Excel files allowed"));
    }
    cb(null, true);
};

const uploadExcel = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Master
app.get("/master-gdsp", getMasterGdspData)
app.put("/master-gdsp/:id", updateMasterGdspData);
app.post("/master/bulk/soft-delete", softDeleteMasterGdsp)
// app.delete("/history-gdsp/:id", softDeleteMasterGdsp);
app.get("/history-gdsp/export", exportHistoryGdsp);
app.post("/master-gdsp/upload-excel", uploadExcel.single("file"), importMasterGdsp)
app.post("/history-gdsp/upload-excel", uploadExcel.single("file"), importHistoryGdsp)
//Historical CRUD 
app.get("/history-gdsp", getHistoryGdsp);
app.get("/history-gdsp/:id", getHistoryGdspById);
app.post("/history-gdsp", createHistoryGdsp);
app.put("/history-gdsp/:id", updateHistoryGdsp);

export default app;