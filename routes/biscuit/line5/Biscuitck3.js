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
      const result = await pool.query(query, [startdate, enddate, minWeightThreshold]);
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
            if (currentGroup.length === 0 || currentGroup[0].weight >= minWeightThreshold) {
                currentGroup.push(current);
            } else {
                groupedData.push(currentGroup);
                currentGroup = [current]; // Mulai grup baru
            }
        } else if (current.weight < 5) { // Grup rendah
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
            const highest = group.reduce((max, item) => (item.weight > max.weight ? item : max), group[0]);
            peaks.push({ type: 'highest', data: highest });
        } else {
            const lowest = group.reduce((min, item) => (item.weight < min.weight ? item : min), group[0]);
            peaks.push({ type: 'lowest', data: lowest });
        }
        isTakingHighest = !isTakingHighest; // Toggle antara mengambil tertinggi dan terendah
    }

    // Urutkan peaks berdasarkan tanggal
    return peaks.sort((a, b) => new Date(a.data.date) - new Date(b.data.date));
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

// Fungsi untuk menentukan shift berdasarkan jam
function getShift(dateStr) {
  const date = new Date(dateStr);
  const hour = date.getHours();
  if (hour >= 7 && hour < 15) return 1;
  if (hour >= 15 && hour < 23) return 2;
  return 3;
}

export default app;
