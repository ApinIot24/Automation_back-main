import { Router } from "express";
import multer from "multer";
import importExcelBiscuit from "../../../controllers/importExcelBiscuit.js";
import fs from "fs";

const router = Router();
const upload = multer({ dest: "uploads/" });

function generateWeeklyDataForTargetYear(
  totalWeeks,
  period,
  startPeriod,
  targetYear
) {
  const weekData = {};
  // Initialize all weeks in target year with default "-"
  for (let i = 1; i <= totalWeeks; i++) {
    weekData[`w${i}`] = "-";
  }

  // Validate period and startPeriod
  if (
    !period ||
    typeof period !== "string" ||
    !startPeriod ||
    typeof startPeriod !== "string"
  ) {
    return weekData;
  }

  const periods = period.split(",").map((p) => p.trim());
  const startPeriods = startPeriod.split(",").map((s) => s.trim());

  if (periods.length !== startPeriods.length) {
    return weekData;
  }

  // Process each period
  for (let idx = 0; idx < periods.length; idx++) {
    const currentPeriod = periods[idx];
    const currentStartPeriod = startPeriods[idx];

    // Extract symbol and interval from currentPeriod
    const symbolMatch = currentPeriod.match(/^[A-Za-z\/]+/);
    const symbol = symbolMatch ? symbolMatch[0] : "-";
    const intervalMatch = currentPeriod.match(/\d+/);
    const interval = intervalMatch ? parseInt(intervalMatch[0], 10) : null;

    if (!interval) continue;

    // Extract year and starting week from currentStartPeriod
    const [startYear, startWeekString] = currentStartPeriod.split("w");
    let startWeek = parseInt(startWeekString?.trim(), 10);
    let year = parseInt(startYear, 10);

    if (isNaN(startWeek) || isNaN(year)) continue;
    if (targetYear < year) continue;

    // Track total weeks passed to maintain the exact pattern
    let totalWeeksPassed = 0;

    // Calculate total weeks passed until target year
    while (year < targetYear) {
      const weeksInYear = getTotalWeeksInYear(year);
      totalWeeksPassed += weeksInYear;
      year++;
    }

    // Calculate the starting week in the target year based on the original pattern
    if (year === targetYear && totalWeeksPassed > 0) {
      // Calculate how many complete intervals have passed
      const totalIntervalsPassed = Math.floor(totalWeeksPassed / interval);
      // The new starting week should maintain the same position in the interval
      const offsetInPattern = (startWeek - 1) % interval;
      startWeek =
        (totalIntervalsPassed * interval + offsetInPattern + 1) % interval;
      if (startWeek === 0) startWeek = interval;
    }

    // Adjust if startWeek exceeds total weeks in target year
    if (year === targetYear) {
      const weeksInTargetYear = getTotalWeeksInYear(targetYear);
      if (startWeek > weeksInTargetYear) {
        startWeek = weeksInTargetYear;
      }
    }

    // Fill weeks in target year based on calculated startWeek and interval
    for (let i = startWeek; i <= totalWeeks; i += interval) {
      weekData[`w${i}`] =
        weekData[`w${i}`] === "-" ? symbol : `${weekData[`w${i}`]},${symbol}`;
    }
  }

  return weekData;
}

function getTotalWeeksInYear(year) {
  const lastDay = new Date(year, 11, 31);
  const firstDayOfYear = new Date(year, 0, 1);
  const dayOfWeek = firstDayOfYear.getDay();
  const firstMonday = new Date(
    year,
    0,
    1 + (dayOfWeek <= 4 ? -dayOfWeek : 7 - dayOfWeek)
  );
  return Math.floor((lastDay - firstMonday) / (7 * 24 * 60 * 60 * 1000));
}

router.get("/pm_biscuit/select/:group", async (req, res) => {
  try {
    const group = parseInt(req.params.group, 10);

    // Query untuk mendapatkan machine_name yang unik
    const result = await req.db.query(
      "SELECT machine_name, no FROM (SELECT DISTINCT ON (machine_name) machine_name, no FROM automation.pm_biscuit WHERE grup = $1 ORDER BY machine_name, no ASC) AS unique_machines ORDER BY no ASC",
      [group]
    );

    // Mengirimkan hasil query sebagai response
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
});

router.get("/pm_biscuit/:group/:year", async (req, res) => {
  try {
    const group = parseInt(req.params.group, 10);
    const year = parseInt(req.params.year, 10); // Tahun target
    const start = parseInt(req.query.start, 10); // Mendapatkan nilai start dari query parameter
    const end = parseInt(req.query.end, 10); // Mendapatkan nilai end dari query parameter
    const searchTerm = req.query.searchTerm
      ? req.query.searchTerm.toLowerCase()
      : ""; // Mendapatkan searchTerm dari query parameter
    // Pastikan start dan end bukan NaN
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ error: "Invalid start or end parameters" });
    }

    // Query untuk memfilter berdasarkan searchTerm
    const result = await req.db.query(
      "SELECT * FROM automation.pm_biscuit WHERE grup = $1 AND (machine_name ILIKE $2 OR kode_barang ILIKE $2 OR equipment ILIKE $2 OR part_kebutuhan_alat ILIKE $2) ORDER BY no ASC LIMIT $3 OFFSET $4",
      [group, `%${searchTerm}%`, end - start + 1, start]
    );

    const totalWeeks = getTotalWeeksInYear(year);
    // console.log(totalWeeks);
    const modifiedData = result.rows.map((row) => ({
      ...row,
      week: generateWeeklyDataForTargetYear(
        totalWeeks,
        row.periode,
        row.periode_start,
        year
      ),
    }));

    res.json(modifiedData);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
});

router.post("/pm_biscuit/machine", async (req, res) => {
  try {
    const { machineName, group } = req.body;

    const result = await req.db.query(
      "SELECT * FROM automation.pm_biscuit WHERE machine_name = $1 AND grup = $2",
      [machineName, group]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error fetching machine data" });
  }
});

// router.get("/pm_biscuit/:group/:year", async (req, res) => {
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
//       "SELECT * FROM automation.pm_biscuit WHERE grup = $1 ORDER BY CAST(no AS INTEGER) ASC LIMIT $2 OFFSET $3",
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

router.get("/pm_biscuit/filter/:group/:year/:week", async (req, res) => {
  try {
    const group = parseInt(req.params.group, 10);
    const year = parseInt(req.params.year, 10);
    const currentWeek = parseInt(req.params.week, 10);

    const result = await req.db.query(
      "SELECT * FROM automation.pm_biscuit WHERE grup = $1 ORDER BY no ASC",
      [group]
    );
    const totalWeeks = getTotalWeeksInYear(year);

    // Hitung range minggu (4 minggu ke depan)
    const startWeek = currentWeek;
    const endWeek = Math.min(currentWeek + 3, totalWeeks);

    const modifiedData = result.rows
      .map((row) => {
        // Generate data mingguan
        const weeklyData = generateWeeklyDataForTargetYear(
          totalWeeks,
          row.periode,
          row.periode_start,
          year
        );

        // Filter minggu yang diinginkan
        const filteredWeeks = {};
        let hasScheduledMaintenance = false; // Flag untuk cek apakah ada maintenance

        for (let i = startWeek; i <= endWeek; i++) {
          const weekValue = weeklyData[`w${i}`];
          if (weekValue !== "-") {
            filteredWeeks[`w${i}`] = weekValue;
            hasScheduledMaintenance = true;
          }
        }

        // Hanya return jika ada maintenance terjadwal
        if (hasScheduledMaintenance) {
          return {
            id: row.id,
            machine_name: row.machine_name,
            part_kebutuhan_alat: row.part_kebutuhan_alat,
            equipment: row.equipment,
            periode: row.periode,
            grup: row.grup,
            week: filteredWeeks,
          };
        }
        return null;
      })
      .filter((item) => item !== null); // Hapus semua item null

    res.json(modifiedData);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
});

router.get("/pm_biscuit/filter/all/:group/:year/:week", async (req, res) => {
  try {
    const group = parseInt(req.params.group, 10);
    const year = parseInt(req.params.year, 10);
    const currentWeek = parseInt(req.params.week, 10);

    const result = await req.db.query(
      "SELECT * FROM automation.pm_biscuit WHERE grup = $1 ORDER BY no ASC",
      [group]
    );

    const totalWeeks = getTotalWeeksInYear(year);
    const startWeek = currentWeek;
    const endWeek = Math.min(currentWeek + 3, totalWeeks);

    const modifiedData = result.rows
      .map((row) => {
        // Generate data mingguan untuk seluruh tahun
        const weeklyData = generateWeeklyDataForTargetYear(
          totalWeeks,
          row.periode,
          row.periode_start,
          year
        );

        // Cek apakah ada maintenance dalam rentang waktu
        let hasMaintenanceInRange = false;
        for (let i = startWeek; i <= endWeek; i++) {
          if (weeklyData[`w${i}`] !== "-") {
            hasMaintenanceInRange = true;
            break;
          }
        }

        // Return data jika ada maintenance dalam rentang
        if (hasMaintenanceInRange) {
          return {
            id: row.id,
            machine_name: row.machine_name,
            part_kebutuhan_alat: row.part_kebutuhan_alat,
            equipment: row.equipment,
            periode: row.periode,
            grup: row.grup,
            week: weeklyData, // Mengembalikan semua data week
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    res.json(modifiedData);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
});

router.get("/pm_biscuit/filter/length/:group/:year/:week", async (req, res) => {
  try {
    const group = parseInt(req.params.group, 10);
    const year = parseInt(req.params.year, 10);
    const currentWeek = parseInt(req.params.week, 10);

    const result = await req.db.query(
      "SELECT * FROM automation.pm_biscuit WHERE grup = $1 ORDER BY no ASC",
      [group]
    );
    const totalWeeks = getTotalWeeksInYear(year);

    // Hitung range minggu (4 minggu ke depan)
    const startWeek = currentWeek;
    const endWeek = Math.min(currentWeek + 4, totalWeeks);

    // Variabel untuk menghitung jumlah data yang valid
    let totalData = 0;

    result.rows.forEach((row) => {
      // Generate data mingguan
      const weeklyData = generateWeeklyDataForTargetYear(
        totalWeeks,
        row.periode,
        row.periode_start,
        year
      );

      // Cek apakah ada maintenance terjadwal dalam range minggu
      let hasScheduledMaintenance = false;
      for (let i = startWeek; i <= endWeek; i++) {
        const weekValue = weeklyData[`w${i}`];
        if (weekValue !== "-") {
          hasScheduledMaintenance = true;
          break; // Keluar dari loop jika sudah ditemukan maintenance
        }
      }

      // Jika ada maintenance terjadwal, tambahkan ke counter
      if (hasScheduledMaintenance) {
        totalData++;
      }
    });

    // Kirim hanya totalData
    res.json({ totalData });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
});

router.post("/pm_biscuit/add_biscuit", async (req, res) => {
  // Validasi body request
  const {
    machine_name,
    equipment,
    kode_barang,
    part_kebutuhan_alat,
    qty,
    periode,
    periode_start,
    grup,
  } = req.body;

  // Validasi field yang required
  if (
    !machine_name ||
    !equipment ||
    !kode_barang ||
    !part_kebutuhan_alat ||
    !qty ||
    !periode ||
    !periode_start ||
    !grup
  ) {
    return res.status(400).json({
      error: "Semua field harus diisi",
    });
  }

  try {
    // Cari nomor urut untuk machine_name yang sama dalam group
    const existingMachineQuery = await req.db.query(
      `SELECT no FROM automation.pm_biscuit 
       WHERE machine_name = $1 AND grup = $2 
       ORDER BY no DESC 
       LIMIT 1`,
      [machine_name, grup]
    );

    let machineNo;
    if (existingMachineQuery.rowCount > 0) {
      // Jika machine_name sudah ada, gunakan nomor yang sama
      machineNo = existingMachineQuery.rows[0].no;
    } else {
      // Jika machine_name belum ada, cari nomor urut terakhir di group
      const lastNumberQuery = await req.db.query(
        `SELECT COALESCE(
          (SELECT MAX(no) FROM automation.pm_biscuit WHERE grup = $1), 
          0
        ) + 1 AS last_number`,
        [grup]
      );

      machineNo = lastNumberQuery.rows[0].last_number.toString();
    }

    // Insert data ke database
    const result = await req.db.query(
      `INSERT INTO automation.pm_biscuit 
       (machine_name, equipment, kode_barang, part_kebutuhan_alat, qty, periode, periode_start, grup, no)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        machine_name,
        equipment,
        kode_barang,
        part_kebutuhan_alat,
        qty,
        periode,
        periode_start,
        grup,
        machineNo,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        error: "Gagal menambahkan data",
      });
    }

    // Return data yang berhasil ditambahkan
    res.status(201).json({
      message: "Data berhasil ditambahkan",
      data: result.rows[0],
      machineNo: machineNo,
    });
  } catch (error) {
    console.error("Error adding PM Biscuit data:", error);

    // Handling specific database errors
    if (error.code === "23505") {
      // Unique violation
      return res.status(400).json({
        error: "Data dengan kode barang tersebut sudah ada",
      });
    }

    res.status(500).json({
      error: "Terjadi kesalahan saat menambahkan data",
      details: error.message,
    });
  }
});

router.put("/pm_biscuit/list/machine/update", async (req, res) => {
  try {
    const { group, machines } = req.body;
    // Validasi input
    if (!group || !Array.isArray(machines) || machines.length === 0) {
      return res.status(400).json({
        error: "Invalid input",
        message: "Group dan daftar mesin harus disediakan",
      });
    }
    try {
      // Loop through each machine in the request
      for (const machine of machines) {
        // Validasi setiap mesin
        if (!machine.name || !machine.order) {
          console.warn(`Mesin tidak valid: ${JSON.stringify(machine)}`);
          continue;
        }

        // Update nomor urutan untuk semua mesin dengan nama yang sama di group tertentu
        const updateQuery = `
          UPDATE automation.pm_biscuit 
          SET no = $1 
          WHERE machine_name = $2 AND grup = $3
        `;
        await req.db.query(updateQuery, [machine.order, machine.name, group]);

        // Jika ada oldName, update nama mesin jika berbeda
        if (machine.oldName && machine.name !== machine.oldName) {
          const renameQuery = `
            UPDATE automation.pm_biscuit 
            SET machine_name = $1 
            WHERE machine_name = $2 AND grup = $3
          `;
          await req.db.query(renameQuery, [
            machine.name,
            machine.oldName,
            group,
          ]);
        }
      }

      res.json({
        message: "Daftar mesin berhasil diperbarui",
        updatedCount: machines.length,
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating machine list:", error);
    res.status(500).json({
      error: "Gagal memperbarui daftar mesin",
      details: error.message,
    });
  }
});

router.put("/pm_biscuit/update_field/:id", async (req, res) => {
  const { id } = req.params;
  const { field, value } = req.body;

  // Daftar kolom yang diperbolehkan untuk diperbarui
  const allowedFields = [
    "machine_name",
    "equipment",
    "kode_barang",
    "part_kebutuhan_alat",
    "qty",
    "periode",
    "periode_start",
  ];

  // Validasi input untuk memastikan kolom yang akan diperbarui diizinkan
  if (!allowedFields.includes(field)) {
    return res.status(400).json({
      error: "Kolom yang diberikan tidak valid atau tidak dapat diperbarui",
    });
  }

  try {
    // Jika field yang diupdate adalah machine_name
    if (field === "machine_name") {
      // Ambil data existing terlebih dahulu
      const existingData = await req.db.query(
        `SELECT grup, machine_name FROM automation.pm_biscuit WHERE id = $1`,
        [id]
      );

      if (existingData.rowCount === 0) {
        return res.status(404).json({ error: "Data tidak ditemukan" });
      }

      const { grup, machine_name: oldMachineName } = existingData.rows[0];

      // Cari nomor urut untuk machine_name yang sama dalam group
      const existingMachineQuery = await req.db.query(
        `SELECT no FROM automation.pm_biscuit 
         WHERE machine_name = $1 AND grup = $2 
         ORDER BY no DESC 
         LIMIT 1`,
        [value, grup]
      );

      let machineNo;
      if (existingMachineQuery.rowCount > 0) {
        // Jika machine_name sudah ada, gunakan nomor yang sama
        machineNo = existingMachineQuery.rows[0].no;
      } else {
        // Jika machine_name belum ada, cari nomor urut terakhir di group
        const lastNumberQuery = await req.db.query(
          `SELECT COALESCE(
            (SELECT MAX(no) FROM automation.pm_biscuit WHERE grup = $1), 
            0
          ) + 1 AS last_number`,
          [grup]
        );

        machineNo = lastNumberQuery.rows[0].last_number;
      }

      // Update machine_name dan no
      const result = await req.db.query(
        `UPDATE automation.pm_biscuit 
         SET machine_name = $1, no = $2 
         WHERE id = $3 RETURNING *`,
        [value, machineNo, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Data tidak ditemukan" });
      }

      // Kirimkan data yang diperbarui sebagai respons
      return res.json({
        message: "Machine name berhasil diperbarui",
        data: result.rows[0],
        machineNo: machineNo,
      });
    }

    // Untuk field selain machine_name, lakukan update biasa
    const result = await req.db.query(
      `UPDATE automation.pm_biscuit SET ${field} = $1 WHERE id = $2 RETURNING *`,
      [value, id]
    );

    if (result.rowCount === 0) {
      // Jika tidak ada baris yang diperbarui, kirimkan respons 404
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    // Kirimkan data yang diperbarui sebagai respons
    res.json({
      message: `${field} berhasil diperbarui`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Error updating ${field}:`, error);
    res.status(500).json({ error: "Terjadi kesalahan saat memperbarui data" });
  }
});

// Endpoint API
router.post("/import/biscuit", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;

  try {
    await importExcelBiscuit(filePath);
    res.status(200).send("Data berhasil diimpor ke PostgreSQL.");
  } catch (error) {
    res.status(500).send("Gagal mengimpor data: " + error.message);
  }
});

router.post("/import/biscuit/:grup", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const grup = req.params.grup; // Mengambil parameter grup dari URL
  try {
    // Anda dapat meneruskan `grup` ke fungsi `importExcelBiscuit` jika diperlukan
    await importExcelBiscuit(filePath, grup);
    res
      .status(200)
      .send(`Data untuk grup ${grup} berhasil diimpor ke PostgreSQL.`);
  } catch (error) {
    res
      .status(500)
      .send(`Gagal mengimpor data untuk grup ${grup}: ` + error.message);
  }
});

router.delete("/deleted/biscuit/:group", async (req, res) => {
  try {
    // Menghapus data di database berdasarkan group
    const group = parseInt(req.params.group, 10);
    const result = await req.db.query(
      "DELETE FROM automation.pm_biscuit WHERE grup = $1 RETURNING *",
      [group]
    );
    // Mengirimkan hasil sebagai JSON, yaitu data yang telah dihapus
    res.json({
      message: "Data deleted successfully",
      deletedData: result.rows,
    });
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).json({ error: "Error deleting data" });
  }
});

router.delete("/deleted/biscuit_pm/batch", async (req, res) => {
  try {
    const { ids } = req.body;
    console.log("Received IDs:", ids);

    // Validasi input
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid or empty IDs array" });
    }
    // Pastikan semua elemen dalam array adalah number
    if (!ids.every((id) => typeof id === "number")) {
      return res.status(400).json({ error: "All IDs must be numbers" });
    }
    // Query untuk menghapus data berdasarkan IDs
    const result = await req.db.query(
      "DELETE FROM automation.pm_biscuit WHERE id = ANY($1::int[]) RETURNING *",
      [ids]
    );
    console.log("Deleted rows:", result.rows);
    // Jika tidak ada data yang dihapus
    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "No data found with the provided IDs",
        deletedData: [],
        deletedCount: 0,
      });
    }
    // Response sukses
    res.json({
      message: "Data deleted successfully",
      deletedData: result.rows,
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).json({
      error: "Error deleting data",
      details: error.message,
    });
  }
});

router.delete("/delete_all_biscuit", async (req, res) => {
  try {
    const result = await req.db.query("DELETE FROM automation.pm_biscuit");
    res.json({
      message: "Semua data telah berhasil dihapus.",
      affectedRows: result.rowCount,
    });
  } catch (error) {
    console.error("Error deleting all data:", error);
    res
      .status(500)
      .json({ error: "Terjadi kesalahan saat menghapus semua data." });
  }
});
export default router;
