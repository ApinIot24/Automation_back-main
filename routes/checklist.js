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

export default app;
