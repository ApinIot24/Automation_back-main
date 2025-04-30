import { Router } from "express";
import fs from "fs";

const app = Router();

function calculateCurrentWeek() {
  const now = new Date();
  const firstMonday = new Date(
    now.getFullYear(),
    0,
    1 + ((1 - new Date(now.getFullYear(), 0, 1).getDay()) % 7)
  );
  const weekNumber = Math.ceil((now - firstMonday) / (1000 * 60 * 60 * 24 * 7));

  return weekNumber;
}

// Mendapatkan data melalui query parameter
app.get("/qrchecklist/checklist/get", async (req, res) => {
  const { scannedData } = req.query;
  const currentWeek = calculateCurrentWeek();

  try {
    if (!scannedData) {
      return res.status(400).json({ error: "Scanned data is required" });
    }

    // Pertama, cari di tabel checklist_pm_biscuit
    let result = await req.db.query(
      "SELECT * FROM automation.checklist_pm_biscuit WHERE qrcode = $1 AND week = $2",
      [scannedData, currentWeek]
    );

    // Jika tidak ditemukan di tabel checklist_pm_biscuit, cari di tabel checklist_pm_wafer
    let allResults = result.rows;

    if (result.rows.length === 0) {
      result = await req.db.query(
        "SELECT * FROM automation.checklist_pm_wafer WHERE qrcode = $1 AND week = $2",
        [scannedData, currentWeek]
      );
      allResults = result.rows;
    }
    console.log(allResults);
    console.log(currentWeek);
    // Mengecek apakah data ditemukan
    if (allResults.length > 0) {
      // Jika ditemukan, kirimkan seluruh hasil
      res.status(200).json({
        message: "QR Code found",
        data: allResults, // Mengirimkan semua data yang ditemukan
      });
    } else {
      // Jika tidak ditemukan
      res.status(404).json({ message: "Checklist not found this week" });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
});

app.put("/qrchecklist/checklist/put", async (req, res) => {
  try {
    const { id, c_i, l, r, keterangan, tanggal, status } = req.body;

    let itemId = id;
    let tableName;

    // Pertama, cari di tabel checklist_pm_biscuit
    const biscuitQuery = `
          SELECT id FROM automation.checklist_pm_biscuit 
          WHERE id = $1
      `;
    const biscuitResult = await req.db.query(biscuitQuery, [id]);

    if (biscuitResult.rows.length > 0) {
      tableName = "automation.checklist_pm_biscuit";
    } else {
      // Jika tidak ada di biscuit, cari di wafer
      const waferQuery = `
              SELECT id FROM automation.checklist_pm_wafer 
              WHERE id = $1
          `;
      const waferResult = await req.db.query(waferQuery, [id]);

      if (waferResult.rows.length > 0) {
        tableName = "automation.checklist_pm_wafer";
      } else {
        return res.status(404).json({ error: "Item not found in both tables" });
      }
    }

    // Query update dengan mapping status
    const updateQuery = `
          UPDATE ${tableName}
          SET 
              c_i = $1, 
              l = $2, 
              r = $3, 
              keterangan = $4, 
              tanggal = $5, 
              status_checklist = $6
          WHERE id = $7
      `;

    await req.db.query(updateQuery, [
      c_i,
      l,
      r,
      keterangan,
      tanggal,
      status,
      itemId,
    ]);

    res.status(200).json({
      message: "Item updated successfully",
      id: itemId,
      table: tableName,
    });
  } catch (error) {
    console.error("Error updating checklist:", error);
    res.status(500).json({
      error: "Error updating checklist",
      details: error.message,
    });
  }
});
export default app;
