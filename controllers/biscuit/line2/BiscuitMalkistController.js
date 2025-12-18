import { rawIot as raw} from "../../../config/sqlRaw.js";

// Function to validate jenis to prevent SQL injection
function isValidJenis(jenis) {
  return /^[a-zA-Z0-9_]+$/.test(jenis);
}

// Function to get min weight threshold based on jenis
// Setiap jenis memiliki threshold minimal yang berbeda untuk deteksi puncak
function getMinWeightByJenis(jenis) {
  // Mapping threshold minimal untuk setiap jenis
  // Nilai threshold menentukan berat minimal yang dianggap sebagai puncak
  // Sesuaikan nilai threshold sesuai dengan karakteristik setiap jenis produk
  const thresholdMap = {
    // Contoh threshold untuk berbagai jenis
    // Format: 'nama_jenis': nilai_threshold
    // Tambahkan atau ubah threshold sesuai kebutuhan produksi
    
    // Contoh jenis dengan threshold berbeda:
    'malkist_original': 10,
    'malkist_keju': 12,
    'malkist_coklat': 15,
    'malkist_strawberry': 11,
    'malkist_vanilla': 13,
    
    // Default threshold jika jenis tidak ditemukan dalam mapping
    'default': 0
  };

  // Normalize jenis untuk case-insensitive matching
  const normalizedJenis = jenis.toLowerCase().trim();
  
  // Cari threshold berdasarkan jenis
  // Jika jenis ditemukan, gunakan threshold spesifik
  // Jika tidak ditemukan, gunakan default threshold
  if (thresholdMap[normalizedJenis] !== undefined) {
    return thresholdMap[normalizedJenis];
  }
  
  // Fallback ke default jika jenis tidak ada dalam mapping
  return thresholdMap['default'];
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
// Logika: Deteksi siklus naik-turun, setiap siklus menghasilkan satu puncak
// Contoh: 0,1,2,3,4,5,3,2,1,2,3,4,5,6 → ada 2 puncak (5 dan 6)
function getPeakData(data, jenis) {
  const peaks = [];
  let minWeightThreshold = getMinWeightByJenis(jenis);

  if (data.length === 0) return peaks;

  let currentPeak = null; // Menyimpan puncak saat ini
  let isRising = false; // Apakah sedang dalam trend naik
  let previousWeight = null; // Berat sebelumnya untuk deteksi trend
  let dropThreshold = 0.5; // Threshold penurunan untuk mengkonfirmasi akhir siklus

  for (let i = 0; i < data.length; i++) {
    const current = data[i];

    // Melewati data yang tidak valid
    if (current.weight === 0 || current.weight < 0) {
      continue;
    }

    // Skip jika belum ada data sebelumnya
    if (previousWeight === null) {
      previousWeight = current.weight;
      // Mulai siklus pertama jika data valid
      isRising = true;
      currentPeak = current;
      continue;
    }

    const weightDiff = current.weight - previousWeight;

    // Deteksi trend naik
    if (weightDiff > 0) {
      if (!isRising) {
        // Mulai siklus naik baru (setelah turun, sekarang naik lagi)
        isRising = true;
        currentPeak = current;
      } else if (currentPeak !== null && current.weight > currentPeak.weight) {
        // Update puncak jika lebih tinggi
        currentPeak = current;
      } else if (currentPeak === null) {
        // Jika isRising tapi currentPeak null, inisialisasi
        currentPeak = current;
      }
    }
    // Deteksi trend turun
    else if (weightDiff < 0) {
      if (isRising && currentPeak !== null) {
        // Sedang turun dari puncak
        const dropAmount = currentPeak.weight - current.weight;
        
        // Jika turun cukup signifikan (>= dropThreshold), simpan puncak dan reset untuk siklus berikutnya
        // Threshold digunakan sebagai fallback jika dropThreshold tidak tercapai tapi turun di bawah threshold
        if (dropAmount >= dropThreshold || current.weight < minWeightThreshold) {
          // Cek apakah puncak serupa sudah ada (dalam waktu 60 detik)
          const isDuplicate = peaks.some(
            (p) =>
              Math.abs(p.weight - currentPeak.weight) < 0.01 &&
              Math.abs(new Date(p.date) - new Date(currentPeak.date)) < 60000
          );

          if (!isDuplicate) {
            peaks.push(currentPeak);
          }

          // Reset untuk siklus berikutnya
          currentPeak = null;
          isRising = false;
        }
      }
    }
    // Data sama (weightDiff === 0)
    else {
      // Jika sedang naik dan data sama, tetap update currentPeak jika lebih tinggi atau sama
      if (isRising && currentPeak !== null && current.weight >= currentPeak.weight) {
        currentPeak = current;
      }
    }

    previousWeight = current.weight;
  }

  // Proses puncak terakhir jika masih ada yang belum disimpan
  if (currentPeak !== null && isRising) {
    const isDuplicate = peaks.some(
      (p) =>
        Math.abs(p.weight - currentPeak.weight) < 0.01 &&
        Math.abs(new Date(p.date) - new Date(currentPeak.date)) < 60000
    );

    if (!isDuplicate) {
      peaks.push(currentPeak);
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
function getlowerhighdata(data, jenis, peakData = []) {
  const peaks = [];

  // Jika ada peakData dari getPeakData, gunakan untuk menentukan siklus
  if (peakData && peakData.length > 0) {
    // Untuk setiap puncak, cari titik terendah sebelum puncak berikutnya
    for (let i = 0; i < peakData.length; i++) {
      const currentPeak = peakData[i];
      const nextPeak = peakData[i + 1];
      
      // Tambahkan highest dari puncak saat ini
      peaks.push({ type: "highest", data: currentPeak });
      
      // Cari titik terendah antara puncak saat ini dan puncak berikutnya
      const startDate = new Date(currentPeak.date);
      const endDate = nextPeak ? new Date(nextPeak.date) : new Date(data[data.length - 1].date);
      
      // Cari data di antara dua puncak (cari yang terendah, tidak harus < 5)
      const dataBetween = data.filter(
        (d) => {
          const dDate = new Date(d.date);
          return dDate > startDate && dDate < endDate && d.weight > 0;
        }
      );
      
      if (dataBetween.length > 0) {
        const lowest = dataBetween.reduce(
          (min, item) => (item.weight < min.weight ? item : min),
          dataBetween[0]
        );
        
        // Pastikan lowest lebih rendah dari currentPeak
        if (lowest.weight < currentPeak.weight) {
          // Cek duplikat
          const isDuplicate = peaks.some(
            (p) =>
              p.type === "lowest" &&
              Math.abs(p.data.weight - lowest.weight) < 0.01 &&
              Math.abs(new Date(p.data.date) - new Date(lowest.date)) < 60000
          );

          if (!isDuplicate) {
            peaks.push({ type: "lowest", data: lowest });
          }
        }
      }
    }
  } else {
    // Fallback ke logika lama jika tidak ada peakData
    let minWeightThreshold = getMinWeightByJenis(jenis);
    let groupedData = [];
    let currentGroup = [];

    // Pengelompokan data berdasarkan kriteria
    for (const current of data) {
      if (current.weight <= 0) continue;

      if (current.weight >= minWeightThreshold) {
        if (
          currentGroup.length === 0 ||
          currentGroup[0].weight >= minWeightThreshold
        ) {
          currentGroup.push(current);
        } else {
          groupedData.push(currentGroup);
          currentGroup = [current];
        }
      } else if (current.weight < 5) {
        if (currentGroup.length === 0 || currentGroup[0].weight < 5) {
          currentGroup.push(current);
        } else {
          groupedData.push(currentGroup);
          currentGroup = [current];
        }
      }
    }

    if (currentGroup.length > 0) {
      groupedData.push(currentGroup);
    }

    for (const group of groupedData) {
      const isHighGroup = group[0].weight >= minWeightThreshold;
      
      if (isHighGroup) {
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
    }
  }

  // Urutkan berdasarkan waktu
  peaks.sort((a, b) => new Date(a.data.date) - new Date(b.data.date));

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
        const lowerhigh = getlowerhighdata(rawData, jenis, peaks);
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