import { Router } from "express";
import moment from "moment";
import pool from "../../../config/users.js";
const app = Router();

function format(date) {
  if (!(date instanceof Date)) {
    throw new Error('Invalid "date" argument. You must pass a date instance');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthWeek(year, month, week) {
  let d = new Date(year, month - 1, 4);
  let day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setDate(d.getDate() + 7 * (week - 1));
  return d;
}
function getWeek(date) {
  let monthStart = new Date(date);
  monthStart.setDate(0);
  let offset = ((monthStart.getDay() + 1) % 7) - 1; // -1 is for a week starting on Monday
  return Math.ceil((date.getDate() + offset) / 7);
}
// Return array of dates for specified week of month of year
function getWeekDates(year, month, week) {
  let d = getMonthWeek(year, month, week);
  for (var i = 0, arr = []; i < 7; i++) {
    arr.push(d.toLocaleDateString());
    d.setDate(d.getDate() + 1);
  }
  return arr;
}

app.post("/ck_biscuit/loadcell/processed", async (req, res) => {
  const { startDate, endDate, additionalData } = req.body;

  // Ensure `additionalData` is an array and valid
  if (!Array.isArray(additionalData)) {
    return res
      .status(400)
      .send("Invalid data format for additionalData. It should be an array.");
  }

  // Ensure valid date formats (YYYY-MM-DD)
  const startDateValid = /^\d{4}-\d{2}-\d{2}$/.test(startDate);
  const endDateValid = /^\d{4}-\d{2}-\d{2}$/.test(endDate);

  if (!startDateValid || !endDateValid) {
    return res.status(400).send("Invalid date format. Use YYYY-MM-DD.");
  }

  const results = {
    chartData: [],
    tableData: [],
  };

  // Initialize overall total shift data across all databases
  let overallShift1Total = 0;
  let overallShift2Total = 0;
  let overallShift3Total = 0;
  let overallTotalShift = 0;

  for (let db of additionalData) {
    try {
      let namedatabase = getDatabaseName(db);
      let minWeightThreshold;

      // Define weight threshold for each database
      if (namedatabase === "ck_biscuit_palm_oil_") {
        minWeightThreshold = 86.5;
      } else if (namedatabase === "ck_biscuit_mixer_") {
        minWeightThreshold = 258.7;
      } else {
        minWeightThreshold = 0; // Default threshold
      }

      const query = `
        SELECT weight, date
        FROM purwosari."${db}"
        WHERE date::date BETWEEN $1 AND $2
        AND (weight > $3 OR weight < 5)
        ORDER BY date;
      `;

      const result = await pool.query(query, [
        startDate,
        endDate,
        minWeightThreshold,
      ]);
      const rawData = result.rows;

      // Process the raw data (detect peaks and group by shift)
      const peaks = getPeakData(rawData, db);
      const groupedData = groupDataByDateAndShift(peaks);

      // Prepare chart data and table data
      const chartData = prepareChartData(groupedData, db, startDate, endDate);
      const tableData = prepareTableData(groupedData, db);

      // Add this database's chart data to the overall results
      results.chartData.push({
        database: `${db.replace(/_/g, " ").toUpperCase()}`,
        chartData,
      });

      // Add this database's table data to the overall results
      results.tableData = results.tableData.concat(tableData);

      // Accumulate total shifts for the overall total (across all databases)
      overallShift1Total += chartData.shift1Data[0];
      overallShift2Total += chartData.shift2Data[0];
      overallShift3Total += chartData.shift3Data[0];
      overallTotalShift += chartData.totalShiftData[0];

      // Sort the table data by date
      results.tableData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });
    } catch (error) {
      console.error("Error executing query", error);
      return res.status(500).send("Error executing query.");
    }
  }

  // After all databases are processed, add a final entry for overall totals
  results.chartData.push({
    database: "TOTAL SHIFTS",
    chartData: {
      labels: ["TOTAL SHIFTS"],
      shift1Data: [overallShift1Total],
      shift2Data: [overallShift2Total],
      shift3Data: [overallShift3Total],
      totalShiftData: [overallTotalShift],
    },
  });

  results.tableData.push({
    database: "TOTAL SHIFTS",
    date: "TOTAL",
    "Shift 1": overallShift1Total,
    "Shift 2": overallShift2Total,
    "Shift 3": overallShift3Total,
    total: overallTotalShift,
  });
  // console.log(JSON.stringify(results, null, 2));
  // Send the processed results to the client
  res.json({ results });
});

// Function to prepare chart data from grouped data
function prepareChartData(groupedData, db, startDate, endDate) {
  const chartData = {
    labels: [
      `${db.replace(/_/g, " ").toUpperCase()} ${startDate} - ${endDate}`,
    ], // Combined label for the database and date range
    shift1Data: [0],
    shift2Data: [0],
    shift3Data: [0],
    totalShiftData: [0], // Total shift data for all shifts combined
  };

  // Total for each shift type across all dates
  let totalShift1 = 0;
  let totalShift2 = 0;
  let totalShift3 = 0;
  groupedData.forEach((item) => {
    // Sum all shifts for each shift type
    totalShift1 += item["Shift 1"];
    totalShift2 += item["Shift 2"];
    totalShift3 += item["Shift 3"];
  });

  // Assign the total shift values to their respective arrays
  chartData.shift1Data[0] = totalShift1;
  chartData.shift2Data[0] = totalShift2;
  chartData.shift3Data[0] = totalShift3;

  // Total shift data (all shifts combined)
  chartData.totalShiftData[0] = totalShift1 + totalShift2 + totalShift3;

  return chartData;
}
// Function to prepare table data from grouped data
function prepareTableData(groupedData, db) {
  return groupedData.map((item) => ({
    database: db, // Adding database to each table entry
    date: item.date,
    "Shift 1": item["Shift 1"],
    "Shift 2": item["Shift 2"],
    "Shift 3": item["Shift 3"],
    total: item.total,
  }));
}

// Function to group data by date and shift
function groupDataByDateAndShift(peaks) {
  const groupedByDate = {};

  peaks.forEach((item) => {
    let date;
    if (typeof item.date === "string") {
      date = item.date.split("T")[0]; // Extract date in YYYY-MM-DD format
    } else if (item.date instanceof Date) {
      date = item.date.toISOString().split("T")[0]; // Convert Date object to string
    } else {
      console.error("Invalid date format:", item.date);
      return;
    }

    if (!groupedByDate[date]) {
      groupedByDate[date] = {
        "Shift 1": 0,
        "Shift 2": 0,
        "Shift 3": 0,
        total: 0,
      };
    }

    const shift = getShift(item.date);

    // Increment shift counts based on shift value
    if (shift === 1) groupedByDate[date]["Shift 1"]++;
    else if (shift === 2) groupedByDate[date]["Shift 2"]++;
    else if (shift === 3) groupedByDate[date]["Shift 3"]++;

    groupedByDate[date].total++;
  });

  return Object.keys(groupedByDate).map((date) => ({
    date,
    ...groupedByDate[date],
  }));
}

app.get(
  "/ck_biscuit/loadcell/processed/:database/:startdate/:enddate",
  async (req, res) => {
    const { database, startdate, enddate } = req.params;
    console.time("queryTime");
    // Menghindari SQL Injection dengan memvalidasi input
    if (!/^[a-zA-Z0-9_]+$/.test(database)) {
      return res.status(400).send("Invalid database name.");
    }

    // Memastikan format startdate dan enddate valid (contoh format: YYYY-MM-DD)
    const startDateValid = /^\d{4}-\d{2}-\d{2}$/.test(startdate);
    const endDateValid = /^\d{4}-\d{2}-\d{2}$/.test(enddate);

    if (!startDateValid || !endDateValid) {
      return res.status(400).send("Invalid date format. Use YYYY-MM-DD.");
    }
    let namedatabase = getDatabaseName(database);
    let minWeightThreshold;

    // Tentukan ambang batas (threshold) berat berdasarkan database
    if (namedatabase === "ck_biscuit_palm_oil_") {
      minWeightThreshold = 86.5;
    } else if (namedatabase === "ck_biscuit_mixer_") {
      minWeightThreshold = 258.7;
    } else {
      minWeightThreshold = 0; // Ambang batas default
    }
    // console.log(minWeightThreshold)

    try {
      // Membuat query SQL dengan menggunakan parameter yang disanitasi
      const query = `
        SELECT weight, date
        FROM purwosari."${database}"
        WHERE date::date BETWEEN $1 AND $2
        AND (weight > $3 OR weight < 5) 
        ORDER BY date;
      `;

      // Menjalankan query dengan parameter binding startdate dan enddate
      const result = await pool.query(query, [
        startdate,
        enddate,
        minWeightThreshold,
      ]);
      // Menyimpan data yang didapat
      const rawData = result.rows;
      // console.log(rawData)
      // Proses data di server (deteksi puncak dan pengelompokan shift)
      const peaks = getPeakData(rawData, database);
      const lowerhigh = getlowerhighdata(rawData, database);
      const groupedData = groupDataByShift(peaks);

      // Mengirimkan data yang sudah diproses ke front-end
      res.json({
        chartData: lowerhigh, // Data mentah untuk grafik line (misalnya berat mesin per waktu)
        tableData: groupedData, // Data yang sudah dikelompokkan berdasarkan shift
      });
    } catch (error) {
      console.error("Error executing query", error);
      res.status(500).send("Error executing query.");
    }
    console.timeEnd("queryTime");
  }
);

// Fungsi untuk mendapatkan nama database tanpa angka
function getDatabaseName(database) {
  const result = database.replace(/\d+/g, ""); // Menghapus angka
  return result;
}

// Fungsi untuk mengelompokkan data berdasarkan shift
function groupDataByShift(peaks) {
  const grouped = {
    "Shift 1": [],
    "Shift 2": [],
    "Shift 3": [],
  };

  peaks.forEach((item) => {
    const shift = getShift(item.date);
    if (shift === 1) grouped["Shift 1"].push(item);
    else if (shift === 2) grouped["Shift 2"].push(item);
    else grouped["Shift 3"].push(item);
  });

  return Object.entries(grouped).map(([shift, details]) => ({
    shift,
    operation_count: details.length,
    details,
  }));
}

// Fungsi untuk mendeteksi puncak (peak detection)
function getPeakData(data, database) {
  const peaks = [];
  let namedatabase = getDatabaseName(database);
  let minWeightThreshold;

  // Menentukan ambang batas berdasarkan nama database
  if (namedatabase === "ck_biscuit_palm_oil_") {
    minWeightThreshold = 86.5;
  } else if (namedatabase === "ck_biscuit_mixer_") {
    minWeightThreshold = 258.7;
  } else {
    minWeightThreshold = 0; // Ambang batas default
  }

  let currentGroup = []; // Menampung data dalam satu grup
  let isInPeakRegion = false; // Menandakan apakah sedang dalam region puncak

  for (let i = 0; i < data.length; i++) {
    const current = data[i];

    // Melewati data yang tidak valid
    if (current.weight === 0 || current.weight < 0) {
      continue;
    }

    // Jika data di atas threshold, masuk ke region puncak
    if (current.weight >= minWeightThreshold) {
      if (!isInPeakRegion) {
        // Memulai region puncak baru
        isInPeakRegion = true;
        currentGroup = [current];
      } else {
        currentGroup.push(current);
      }
    } else {
      if (isInPeakRegion && currentGroup.length > 0) {
        const highest = currentGroup.reduce(
          (max, item) => (item.weight > max.weight ? item : max),
          currentGroup[0]
        );

        // Memastikan puncak belum ada dalam array peaks
        const duplicates = currentGroup.filter(
          (item) => Math.abs(item.weight - highest.weight) < 0.01
        );

        const selectedPeak = duplicates[0]; // Ambil salah satu, misalnya yang pertama atau yang lebih awal

        peaks.push(selectedPeak);

        // Reset untuk grup berikutnya
        currentGroup = [];
        isInPeakRegion = false;
      }
    }
  }

  // Proses grup terakhir jika masih ada data yang belum diproses
  if (isInPeakRegion && currentGroup.length > 0) {
    const highest = currentGroup.reduce(
      (max, item) => (item.weight > max.weight ? item : max),
      currentGroup[0]
    );

    const isDuplicate = peaks.some(
      (p) =>
        Math.abs(p.weight - highest.weight) < 0.01 &&
        Math.abs(new Date(p.date) - new Date(highest.date)) < 60000
    );

    if (!isDuplicate) {
      peaks.push(highest);
    }
  }

  // Urutkan peaks berdasarkan tanggal
  return peaks.sort((a, b) => new Date(a.date) - new Date(b.date));
}
// Fungsi untuk menentukan shift berdasarkan jam
function getShift(dateStr) {
  const date = new Date(dateStr);
  const hour = date.getHours();
  const day = date.getDay(); // untuk mengecek hari

  // Cek apakah hari ini Sabtu (day 6 adalah Sabtu)
  if (day === 6) {
    if (hour >= 7 && hour < 12) return 1; // shift 1: 7:00 - 11:59
    if (hour >= 12 && hour < 17) return 2; // shift 2: 12:00 - 16:59
    if (hour >= 17 && hour < 22) return 3; // shift 3: 17:00 - 21:59
    return 4; // setelah jam 22, tidak ada shift
  }

  // Jika bukan hari Sabtu, gunakan logika default
  if (hour >= 7 && hour < 15) return 1;
  if (hour >= 15 && hour < 23) return 2;
  return 3; // shift malam
}

function getlowerhighdata(data, database) {
  const namedatabase = getDatabaseName(database);
  let minWeightThreshold;

  // Menentukan ambang batas berdasarkan nama database
  if (namedatabase === "ck_biscuit_palm_oil_") {
    minWeightThreshold = 86.5;
  } else if (namedatabase === "ck_biscuit_mixer_") {
    minWeightThreshold = 258.7;
  } else {
    minWeightThreshold = 0; // Ambang batas default
  }

  let groupedData = [];
  let currentGroup = [];

  // Pengelompokan data berdasarkan kriteria
  for (const current of data) {
    if (current.weight <= 0) continue; // Melewati data tidak valid

    if (current.weight >= minWeightThreshold) {
      if (
        currentGroup.length === 0 ||
        currentGroup[0].weight >= minWeightThreshold
      ) {
        currentGroup.push(current);
      } else {
        groupedData.push(currentGroup);
        currentGroup = [current]; // Mulai grup baru
      }
    } else if (current.weight < 5) {
      // Grup rendah
      if (currentGroup.length === 0 || currentGroup[0].weight < 5) {
        currentGroup.push(current);
      } else {
        groupedData.push(currentGroup);
        currentGroup = [current]; // Mulai grup baru
      }
    }
  }

  // Tambah grup yang tersisa
  if (currentGroup.length > 0) {
    groupedData.push(currentGroup);
  }

  const peaks = [];
  let isTakingHighest = true; // Awali dengan mengambil tertinggi

  for (const group of groupedData) {
    if (isTakingHighest) {
      const highest = group.reduce(
        (max, item) => (item.weight > max.weight ? item : max),
        group[0]
      );
      peaks.push({ type: "highest", data: highest });
    } else {
      const lowest = group.reduce(
        (min, item) => (item.weight < min.weight ? item : min),
        group[0]
      );
      peaks.push({ type: "lowest", data: lowest });
    }
    isTakingHighest = !isTakingHighest; // Toggle antara mengambil tertinggi dan terendah
  }

  // Urutkan peaks berdasarkan tanggal
  return peaks.sort((a, b) => new Date(a.data.date) - new Date(b.data.date));
}

export default app;
