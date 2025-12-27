import { Router } from "express"
import { getUserGdspData, updateUserGdspData, softDeleteUserGdsp } from "../../controllers/gdsp/master_user/MasterUserController.js"
import { createHistoryUserGdsp, getHistoryUserGdsp, getHistoryUserGdspById, updateHistoryUserGdsp } from "../../controllers/gdsp/master_user/HistoryCrudUserController.js";
import { importHistoryUser, importMasterUser } from "../../controllers/gdsp/master_user/ImportUserController.js";
import multer from "multer";
import path from "path";
import { exportHistoryUserGdsp } from "../../controllers/gdsp/master_user/ExportUserController.js";
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
app.get("/user-gdsp", getUserGdspData)
app.put("/user-gdsp/:id", updateUserGdspData);
// app.delete("/user/history-gdsp/:id", softDeleteUserGdsp);
app.post("/user-gdsp/bulk/soft-delete", softDeleteUserGdsp);

app.get("/user/history-gdsp/export", exportHistoryUserGdsp);
app.post("/user-gdsp/upload-excel", uploadExcel.single("file"), importMasterUser)
app.post("/user/history-gdsp/upload-excel", uploadExcel.single("file"), importHistoryUser)
//Historical CRUD
app.get("/user/history-gdsp", getHistoryUserGdsp);
app.get("/user/history-gdsp/:id", getHistoryUserGdspById);
app.post("/user/history-gdsp", createHistoryUserGdsp);
app.put("/user/history-gdsp/:id", updateHistoryUserGdsp);


export default app