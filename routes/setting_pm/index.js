import { Router } from "express";
import { upsertSettingPM } from "../../controllers/setting_pm/SettingPmController.js";

const router = Router();

router.post("/setting_pm/:PMTableName/:grup", upsertSettingPM
    // async (req, res) => {
    //     const { PMTableName, grup } = req.params;
    //     const { week } = req.body;

    //     try {
    //         // Check if the record exists first
    //         const existingRecord = await req.db.query(
    //             `SELECT * FROM automation.setting_pm 
    //             WHERE pmtablename = $1 AND grup = $2`,
    //             [PMTableName, grup]
    //         );

    //         let result;
    //         if (existingRecord.rows.length > 0) {
    //             // Update existing record
    //             result = await req.db.query(
    //                 `UPDATE automation.setting_pm 
    //                 SET week = $3, updated_at = NOW() 
    //                 WHERE pmtablename = $1 AND grup = $2 
    //                 RETURNING *`,
    //                 [PMTableName, grup, week]
    //             );
    //         } else {
    //             // Insert new record
    //             result = await req.db.query(
    //                 `INSERT INTO automation.setting_pm 
    //                 (pmtablename, grup, week, created_at) 
    //                 VALUES ($1, $2, $3, NOW()) 
    //                 RETURNING *`,
    //                 [PMTableName, grup, week]
    //             );
    //         }

    //         res.json({
    //             message: "Setting updated/inserted successfully.",
    //             data: result.rows[0],
    //             affectedRows: result.rowCount,
    //         });
    //     } catch (error) {
    //         console.error("Error setting:", error);
    //         res.status(500).json({ 
    //             error: "Error updating/inserting setting.",
    //             details: error.message 
    //         });
    //     }
    // }
);

export default router;