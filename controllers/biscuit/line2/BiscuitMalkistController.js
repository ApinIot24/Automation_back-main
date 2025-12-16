import { rawIot as raw} from "../../../config/sqlRaw.js";

// Function to validate jenis to prevent SQL injection
function isValidJenis(jenis) {
  return /^[a-zA-Z0-9_]+$/.test(jenis);
}

// Function to get min weight threshold based on jenis
function getMinWeightByJenis(jenis) {
  // Sesuaikan threshold berdasarkan jenis jika diperlukan
  // Untuk sekarang, menggunakan threshold default
  return 0;
}

// Function to prepare chart data from grouped data
function prepareChartData(groupedData, jenis, startDate, endDate) {
  const chartData = {
    labels: [
      `${jenis.replace(/_/g, " ").toUpperCase()} ${startDate} - ${endDate}`,
    ], // Combined label for the jenis and date range
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
function prepareTableData(groupedData, jenis) {
  return groupedData.map((item) => ({
    jenis: jenis, // Adding jenis to each table entry
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

    // Skip jika tidak ada shift (misalnya setelah jam 22 di Sabtu)
    if (shift === null) return;

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
// Function removed - tidak diperlukan lagi karena menggunakan jenis langsung
// Fungsi untuk mengelompokkan data berdasarkan shift
function groupDataByShift(peaks) {
  const grouped = {
    "Shift 1": [],
    "Shift 2": [],
    "Shift 3": [],
  };

  peaks.forEach((item) => {
    const shift = getShift(item.date);
    // Skip jika tidak ada shift (misalnya setelah jam 22 di Sabtu)
    if (shift === null) return;
    if (shift === 1) grouped["Shift 1"].push(item);
    else if (shift === 2) grouped["Shift 2"].push(item);
    else if (shift === 3) grouped["Shift 3"].push(item);
  });

  return Object.entries(grouped).map(([shift, details]) => ({
    shift,
    operation_count: details.length,
    details,
  }));
}
// Fungsi untuk mendeteksi puncak (peak detection)
function getPeakData(data, jenis) {
  const peaks = [];
  let minWeightThreshold = getMinWeightByJenis(jenis);

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
    // Sabtu: mulai jam 7, per 5 jam kembali
    if (hour >= 7 && hour < 12) return 1; // shift 1: 7:00 - 11:59 (5 jam)
    if (hour >= 12 && hour < 17) return 2; // shift 2: 12:00 - 16:59 (5 jam)
    if (hour >= 17 && hour < 22) return 3; // shift 3: 17:00 - 21:59 (5 jam)
    // Setelah jam 22 sampai sebelum jam 7, tidak ada shift
    return null; // tidak ada shift
  }

  // Hari biasa: mulai jam 7, per 8 jam kembali
  if (hour >= 7 && hour < 15) return 1; // shift 1: 7:00 - 14:59 (8 jam)
  if (hour >= 15 && hour < 23) return 2; // shift 2: 15:00 - 22:59 (8 jam)
  // Shift 3: 23:00 - 6:59 (8 jam)
  return 3; // shift malam
}
function getlowerhighdata(data, jenis) {
  let minWeightThreshold = getMinWeightByJenis(jenis);

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

export const GetCkBiskuitLoadcell = async (req, res) => {
    const { database: jenis, startdate, enddate } = req.params;

    if (!isValidJenis(jenis)) {
        return res.status(400).send("Invalid jenis.");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startdate) || !/^\d{4}-\d{2}-\d{2}$/.test(enddate)) {
        return res.status(400).send("Invalid date format. Use YYYY-MM-DD.");
    }

    const minWeight = getMinWeightByJenis(jenis);

    const sql = `
        SELECT weight, created_at as date
        FROM purwosari.ck_malkist
        WHERE jenis = '${jenis}'
        AND created_at::date BETWEEN '${startdate}' AND '${enddate}'
        AND (weight > ${minWeight} OR weight < 5)
        ORDER BY created_at;
    `;

    try {
        const rawData = await raw(sql);

        const peaks = getPeakData(rawData, jenis);
        const lowerhigh = getlowerhighdata(rawData, jenis);
        const grouped = groupDataByShift(peaks);

        res.json({
        chartData: lowerhigh,
        tableData: grouped,
        });
    } catch (error) {
        console.error("Loadcell GET error:", error);
        res.status(500).send("Error executing query.");
    }
}
export const PostProcessedLoadcell = async (req, res) => {
    const { startDate, endDate, additionalData } = req.body 
    
    if (!Array.isArray(additionalData)) {
        return res.status(400).send("Invalid data format for additionalData. It should be an array.")
    }

    const startDateValid = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
    const endDateValid = /^\d{4}-\d{2}-\d{2}$/.test(endDate)

    if (!startDateValid || !endDateValid) {
        return res.status(400).send("Invalid date format. use YYYY-MM-DD.")
    }

    const results = { chartData: [], tableData: [] }

    let overallShift1 = 0;
    let overallShift2 = 0;
    let overallShift3 = 0;
    let overallTotal = 0;

    for (let jenis of additionalData) {
        if (!isValidJenis(jenis)) {
            return res.status(400).send(`Invalid jenis: ${jenis}`);
        }

        const minWeight = getMinWeightByJenis(jenis);

        const sql = `
            SELECT weight, created_at as date
            FROM purwosari.ck_malkist
            WHERE jenis = '${jenis}'
            AND created_at::date BETWEEN '${startDate}' AND '${endDate}'
            AND (weight > ${minWeight} OR weight < 5)
            ORDER BY created_at;
        `;

        try {
            const rawData = await raw(sql);

            const peaks = getPeakData(rawData, jenis);
            const grouped = groupDataByDateAndShift(peaks);

            const chartData = prepareChartData(grouped, jenis, startDate, endDate);
            const tableData = prepareTableData(grouped, jenis);

            results.chartData.push({
                jenis: jenis.toUpperCase(),
                chartData,
            });

            results.tableData = [...results.tableData, ...tableData];

            overallShift1 += chartData.shift1Data[0];
            overallShift2 += chartData.shift2Data[0];
            overallShift3 += chartData.shift3Data[0];
            overallTotal += chartData.totalShiftData[0];
        } catch (err) {
            console.error("Loadcell error:", err);
            return res.status(500).send("Error executing query.");
        }
    }

    // Tambah total akhir
    results.chartData.push({
        jenis: "TOTAL SHIFTS",
        chartData: {
        labels: ["TOTAL SHIFTS"],
        shift1Data: [overallShift1],
        shift2Data: [overallShift2],
        shift3Data: [overallShift3],
        totalShiftData: [overallTotal],
        },
    });

    results.tableData.push({
        jenis: "TOTAL SHIFTS",
        date: "TOTAL",
        "Shift 1": overallShift1,
        "Shift 2": overallShift2,
        "Shift 3": overallShift3,
        total: overallTotal,
    });

    res.json({ results });
};