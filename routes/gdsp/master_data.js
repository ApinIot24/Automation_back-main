import { Router } from "express";
import multer from "multer";
import path from "path";
import { createMasterDataGdsp, deleteMasterDataGdsp, getDeletedMasterDataGdsp, getMasterDataByMaterial, getMasterDataGdsp, restoreMasterDataGdsp, updateMasterDataGdsp } from "../../controllers/gdsp/master_data/MasterDataGdspController.js";
import { importMasterDataGdsp } from "../../controllers/gdsp/master_data/ImportMasterDataController.js";

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
    limits: { fileSize: 40 * 1024 * 1024 }, // 10MB
});

app.get("/master-data/gdsp", getMasterDataGdsp);
app.get("/master-data/gdsp/material/:material", getMasterDataByMaterial);
app.post("/master-data/gdsp", createMasterDataGdsp);
app.put("/master-data/gdsp/:id", updateMasterDataGdsp);
app.post("/master-data/gdsp/import", uploadExcel.single("file"), importMasterDataGdsp);
app.patch("/master-data/gdsp/:id/delete", deleteMasterDataGdsp);
app.get("/master-data/gdsp/deleted", getDeletedMasterDataGdsp);
app.patch("/master-data/gdsp/:id/restore", restoreMasterDataGdsp);

export default app