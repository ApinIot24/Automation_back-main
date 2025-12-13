// import { Router } from "express";
// import multer from "multer";
// import importExcelAstor from "../../../controllers/importExcelAstor.js";

// const router = Router();
// const upload = multer({ dest: "uploads/" });

// function generateWeeklyDataForTargetYear(
//   totalWeeks,
//   period,
//   startPeriod,
//   targetYear
// ) {
//   const weekData = {};
//   // Inisialisasi semua minggu di tahun target dengan default "-"
//   for (let i = 1; i <= totalWeeks; i++) {
//     weekData[`w${i}`] = "-";
//   }

//   // Validasi period dan startPeriod
//   if (
//     !period ||
//     typeof period !== "string" ||
//     !startPeriod ||
//     typeof startPeriod !== "string"
//   ) {
//     return weekData;
//   }

//   const periods = period.split(",").map((p) => p.trim());
//   const startPeriods = startPeriod.split(",").map((s) => s.trim());

//   if (periods.length !== startPeriods.length) {
//     return weekData;
//   }

//   // Proses setiap periode
//   for (let idx = 0; idx < periods.length; idx++) {
//     const currentPeriod = periods[idx];
//     const currentStartPeriod = startPeriods[idx];

//     // Ekstrak simbol dan interval dari currentPeriod
//     const symbolMatch = currentPeriod.match(/^[A-Za-z\/]+/);
//     const symbol = symbolMatch ? symbolMatch[0] : "-";
//     const intervalMatch = currentPeriod.match(/\d+/);
//     const interval = intervalMatch ? parseInt(intervalMatch[0], 10) : null;

//     if (!interval) continue;

//     // console.log(`Period: ${currentPeriod}`);
//     // console.log(`Symbol: ${symbol}, Interval: ${interval}`);

//     // Ekstrak tahun dan minggu awal dari currentStartPeriod
//     const [startYear, startWeekString] = currentStartPeriod.split("w");
//     let startWeek = parseInt(startWeekString?.trim(), 10);
//     let originalYear = parseInt(startYear, 10);

//     if (isNaN(startWeek) || isNaN(originalYear)) continue;

//     // console.log(`Start Period: ${currentStartPeriod}`);
//     // console.log(`Start Year: ${startYear}, Start Week: ${startWeek}`);

//     // Jika kita menghasilkan data untuk tahun awal, cukup isi minggu dari minggu awal
//     if (targetYear === originalYear) {
//       // console.log(
//       //   `Tahun target sama dengan tahun awal. Mulai dari minggu ${startWeek}`
//       // );
//       for (let i = startWeek; i <= totalWeeks; i += interval) {
//         // console.log(`Mengisi minggu: ${i} dengan simbol: ${symbol}`);
//         weekData[`w${i}`] =
//           weekData[`w${i}`] === "-" ? symbol : `${weekData[`w${i}`]},${symbol}`;
//       }
//       continue;
//     }

//     // Jika targetYear sebelum tahun awal, tidak ada entri untuk diisi
//     if (targetYear < originalYear) {
//       // console.log(
//       //   `Tahun target sebelum tahun awal. Tidak ada entri untuk diisi.`
//       // );
//       continue;
//     }

//     // Hitung minggu mana di tahun target yang harus diisi berdasarkan pola
//     // Pertama, hitung total minggu dari tanggal mulai hingga akhir tahun awal
//     let weeksInOriginalYear = getTotalWeeksInYear(originalYear);
//     let weeksFromStartToEndOfOriginalYear = weeksInOriginalYear - startWeek + 1;

//     // console.log(
//     //   `Minggu dari awal hingga akhir tahun awal: ${weeksFromStartToEndOfOriginalYear}`
//     // );

//     // Hitung total minggu di antara tahun awal dan tahun target
//     let totalWeeksInBetween = 0;
//     for (let year = originalYear + 1; year < targetYear; year++) {
//       totalWeeksInBetween += getTotalWeeksInYear(year);
//     }

//     // console.log(`Total minggu di tahun-tahun antara: ${totalWeeksInBetween}`);

//     // Total jumlah minggu dari tanggal mulai hingga awal tahun target
//     let totalWeeksPassed =
//       weeksFromStartToEndOfOriginalYear + totalWeeksInBetween;
//     // console.log(
//     //   `Total minggu yang berlalu sejak awal pola: ${totalWeeksPassed}`
//     // );

//     // Hitung minggu pertama di tahun target di mana pola harus muncul
//     let remainder = totalWeeksPassed % interval;
//     let firstWeekInTargetYear;

//     if (remainder === 0) {
//       // Jika sisa adalah 0, minggu pertama harus minggu pertama
//       firstWeekInTargetYear = 1;
//     } else {
//       // Jika tidak, minggu pertama adalah (interval - remainder + 1)
//       firstWeekInTargetYear = interval - remainder + 1;
//     }

//     // Pastikan minggu pertama berada dalam rentang yang valid
//     firstWeekInTargetYear = Math.max(
//       1,
//       Math.min(firstWeekInTargetYear, totalWeeks)
//     );

//     // console.log(
//     //   `Kemunculan pertama di tahun target pada minggu: ${firstWeekInTargetYear}`
//     // );

//     // Isi minggu di tahun target berdasarkan pola
//     for (let i = firstWeekInTargetYear; i <= totalWeeks; i += interval) {
//       // console.log(`Mengisi minggu: ${i} dengan simbol: ${symbol}`);
//       weekData[`w${i}`] =
//         weekData[`w${i}`] === "-" ? symbol : `${weekData[`w${i}`]},${symbol}`;
//     }
//   }

//   return weekData;
// }

// function getTotalWeeksInYear(year) {
//   const lastDay = new Date(year, 11, 31);
//   const firstDayOfYear = new Date(year, 0, 1);
//   const dayOfWeek = firstDayOfYear.getDay();
//   const firstMonday = new Date(
//     year,
//     0,
//     1 + (dayOfWeek <= 4 ? -dayOfWeek : 7 - dayOfWeek)
//   );
//   return Math.floor((lastDay - firstMonday) / (7 * 24 * 60 * 60 * 1000));
// }

// router.get("/pm_astor/select/:group", async (req, res) => {
//   try {
//     const group = parseInt(req.params.group, 10);

//     // Query untuk mendapatkan machine_name yang unik
//     const result = await req.db.query(
//       "SELECT machine_name, no FROM (SELECT DISTINCT ON (machine_name) machine_name, no FROM automation.pm_astor WHERE grup = $1 ORDER BY machine_name, no ASC) AS unique_machines ORDER BY no ASC",
//       [group]
//     );

//     // Mengirimkan hasil query sebagai response
//     res.json(result.rows);
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     res.status(500).json({ error: "Error fetching data" });
//   }
// });

// router.get("/pm_astor/qrcode/:group", async (req, res) => {
//   try {
//     const group = parseInt(req.params.group, 10); // Get the group parameter from the route
//     if (isNaN(group)) {
//       return res.status(400).send("Invalid group parameter");
//     }

//     // Modified SQL query to fetch distinct QR codes for the given group
//     const result = await req.db.query(
//       "SELECT DISTINCT ON (qrcode) machine_name, qrcode FROM automation.pm_astor WHERE grup = $1 ORDER BY qrcode",
//       [group] // The value of group will replace $1 in the query
//     );

//     res.json(result.rows); // Return the unique result rows as JSON
//   } catch (error) {
//     res.status(500).send("Gagal ambil data: " + error.message);
//   }
// });

// router.get("/pm_astor/:group/:year", async (req, res) => {
//   try {
//     const group = parseInt(req.params.group, 10);
//     const year = parseInt(req.params.year, 10); // Tahun target

//     // Ambil query parameter, jika tidak ada maka beri nilai null
//     const start = req.query.start ? parseInt(req.query.start, 10) : null;
//     const end = req.query.end ? parseInt(req.query.end, 10) : null;
//     const searchTerm = req.query.searchTerm
//       ? req.query.searchTerm.toLowerCase()
//       : "";

//     let result;

//     // Jika parameter start dan end valid, gunakan pagination dan pencarian
//     if (start !== null && end !== null && !isNaN(start) && !isNaN(end)) {
//       result = await req.db.query(
//         `SELECT * FROM automation.pm_astor 
//          WHERE grup = $1 
//            AND (machine_name ILIKE $2 OR kode_barang ILIKE $2 OR equipment ILIKE $2 OR part_kebutuhan_alat ILIKE $2)
//          ORDER BY no ASC 
//          LIMIT $3 OFFSET $4`,
//         [group, `%${searchTerm}%`, end - start + 1, start]
//       );
//     } else {
//       // Jika tidak ada parameter start dan end, ambil seluruh data berdasarkan grup
//       result = await req.db.query(
//         "SELECT * FROM automation.pm_astor WHERE grup = $1 ORDER BY no ASC",
//         [group]
//       );
//     }

//     // Asumsikan fungsi getTotalWeeksInYear dan generateWeeklyDataForTargetYear sudah didefinisikan
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

// router.post("/pm_astor/machine", async (req, res) => {
//   try {
//     const { machineName, group } = req.body;

//     const result = await req.db.query(
//       "SELECT * FROM automation.pm_astor WHERE machine_name = $1 AND grup = $2",
//       [machineName, group]
//     );

//     res.json(result.rows);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Error fetching machine data" });
//   }
// });

// router.get(
//   "/pm_astor/filter/checklist/data/:group/:year/:week",
//   async (req, res) => {
//     try {
//       const group = parseInt(req.params.group, 10);
//       const year = parseInt(req.params.year, 10);
//       const currentWeek = parseInt(req.params.week, 10);

//       const result = await req.db.query(
//         "SELECT * FROM automation.pm_astor WHERE grup = $1 ORDER BY no ASC",
//         [group]
//       );
//       const totalWeeks = getTotalWeeksInYear(year);

//       // Hitung range minggu (4 minggu ke depan)
//       const startWeek = currentWeek;
//       const endWeek = Math.min(currentWeek, totalWeeks);

//       const modifiedData = result.rows
//         .map((row) => {
//           // Generate data mingguan
//           const weeklyData = generateWeeklyDataForTargetYear(
//             totalWeeks,
//             row.periode,
//             row.periode_start,
//             year
//           );

//           // Filter minggu yang diinginkan
//           const filteredWeeks = {};
//           let hasScheduledMaintenance = false; // Flag untuk cek apakah ada maintenance

//           for (let i = startWeek; i <= endWeek; i++) {
//             const weekValue = weeklyData[`w${i}`];
//             if (weekValue !== "-") {
//               filteredWeeks[`w${i}`] = weekValue;
//               hasScheduledMaintenance = true;
//             }
//           }

//           // Hanya return jika ada maintenance terjadwal
//           if (hasScheduledMaintenance) {
//             return {
//               id: row.id,
//               machine_name: row.machine_name,
//               part_kebutuhan_alat: row.part_kebutuhan_alat,
//               equipment: row.equipment,
//               periode: row.periode,
//               kode_barang: row.kode_barang,
//               grup: row.grup,
//               week: filteredWeeks,
//             };
//           }
//           return null;
//         })
//         .filter((item) => item !== null); // Hapus semua item null

//       res.json(modifiedData);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       res.status(500).json({ error: "Error fetching data" });
//     }
//   }
// );
// router.get(
//   "/pm_astor/filter/checklist/:group/:year/:week",
//   async (req, res) => {
//     try {
//       const group = parseInt(req.params.group, 10);
//       const year = parseInt(req.params.year, 10);
//       const currentWeek = parseInt(req.params.week, 10);

//       // Asumsikan kamu sudah punya fungsi untuk menghitung total minggu dalam satu tahun
//       const totalWeeks = getTotalWeeksInYear(year); // Implementasikan fungsi ini sesuai kebutuhan

//       // Query database dengan filter berdasarkan grup, tahun, dan minggu
//       const result = await req.db.query(
//         `
//         SELECT
//           id,
//           pm_astor_id,
//           status_checklist,
//           pic,
//           c_i,
//           l,
//           r,
//           keterangan,
//           foto,
//           created_at,
//           updated_at,
//           week,
//           year,
//           tanggal,
//           no,
//           machine_name,
//           part_kebutuhan_alat,
//           equipment,
//           periode,
//           grup,
//           kode_barang,
//           periode_start
//         FROM automation.checklist_pm_astor
//         WHERE grup = $1
//           AND year = $2
//           AND week = $3
//         ORDER BY no ASC;
//         `,
//         [group, year, currentWeek]
//       );
//       const startWeek = currentWeek;
//       const endWeek = Math.min(currentWeek + 1, totalWeeks);

//       // Proses data jika perlu (modifikasi, filter, dll)
//       const modifiedData = result.rows
//         .map((row) => {
//           // Generate data mingguan
//           const weeklyData = generateWeeklyDataForTargetYear(
//             totalWeeks,
//             row.periode,
//             row.periode_start,
//             year
//           );

//           // Filter minggu yang diinginkan
//           const filteredWeeks = {};
//           let hasScheduledMaintenance = false; // Flag untuk cek apakah ada maintenance

//           for (let i = startWeek; i <= endWeek; i++) {
//             const weekValue = weeklyData[`w${i}`];
//             if (weekValue !== "-") {
//               filteredWeeks[`w${i}`] = weekValue;
//               hasScheduledMaintenance = true;
//             }
//           }

//           // Hanya return jika ada maintenance terjadwal
//           if (hasScheduledMaintenance) {
//             return {
//               id: row.id,
//               pm_astor_id: row.pm_astor_id,
//               status_checklist: row.status_checklist,
//               pic: row.pic,
//               c_i: row.c_i,
//               l: row.l,
//               r: row.r,
//               keterangan: row.keterangan,
//               foto: row.foto,
//               created_at: row.created_at,
//               updated_at: row.updated_at,
//               week: filteredWeeks, // Filtered weeks sesuai dengan minggu yang terjadwal
//               year: row.year,
//               machine_name: row.machine_name,
//               part_kebutuhan_alat: row.part_kebutuhan_alat,
//               equipment: row.equipment,
//               kode_barang: row.kode_barang,
//               periode: row.periode,
//               grup: row.grup,
//               tanggal: row.tanggal,
//             };
//           }

//           return null;
//         })
//         .filter((item) => item !== null); // Hapus semua item null

//       // Kirimkan data hasil query dan modifikasi
//       res.json(modifiedData); // Kirim hasil data yang sudah difilter
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       res.status(500).json({ error: "Error fetching data" });
//     }
//   }
// );

// router.get("/pm_astor/filter/:group/:year/:week", async (req, res) => {
//   try {
//     const group = parseInt(req.params.group, 10);
//     const year = parseInt(req.params.year, 10);
//     const currentWeek = parseInt(req.params.week, 10);
//     let totalweeksetting = await req.db.query(
//       "SELECT week FROM automation.setting_pm WHERE grup = $1 AND pmtablename = 'pm_astor'",
//       [group]
//     );

//     // Pastikan hasil query valid
//     if (!totalweeksetting || !totalweeksetting.rows) {
//       return res.status(500).json({ error: "Failed to fetch week settings" });
//     }

//     // Hitung total minggu dari setting
//     const totalWeeksSettingValue = totalweeksetting.rows[0].week;

//     const result = await req.db.query(
//       "SELECT * FROM automation.pm_astor WHERE grup = $1 ORDER BY no ASC",
//       [group]
//     );
//     const totalWeeks = getTotalWeeksInYear(year);

//     // Hitung range minggu (4 minggu ke depan)
//     const startWeek = currentWeek;
//     const endWeek = Math.min(
//       currentWeek + totalWeeksSettingValue - 1,
//       totalWeeks
//     );

//     const modifiedData = result.rows
//       .map((row) => {
//         // Generate data mingguan
//         const weeklyData = generateWeeklyDataForTargetYear(
//           totalWeeks,
//           row.periode,
//           row.periode_start,
//           year
//         );

//         // Filter minggu yang diinginkan
//         const filteredWeeks = {};
//         let hasScheduledMaintenance = false; // Flag untuk cek apakah ada maintenance

//         for (let i = startWeek; i <= endWeek; i++) {
//           const weekValue = weeklyData[`w${i}`];
//           if (weekValue !== "-") {
//             filteredWeeks[`w${i}`] = weekValue;
//             hasScheduledMaintenance = true;
//           }
//         }

//         // Hanya return jika ada maintenance terjadwal
//         if (hasScheduledMaintenance) {
//           return {
//             id: row.id,
//             machine_name: row.machine_name,
//             part_kebutuhan_alat: row.part_kebutuhan_alat,
//             equipment: row.equipment,
//             periode: row.periode,
//             kode_barang: row.kode_barang,
//             grup: row.grup,
//             week: filteredWeeks,
//           };
//         }
//         return null;
//       })
//       .filter((item) => item !== null); // Hapus semua item null

//     res.json(modifiedData);
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     res.status(500).json({ error: "Error fetching data" });
//   }
// });

// router.get("/pm_astor/filter/all/:group/:year/:week", async (req, res) => {
//   try {
//     const group = req.params.group;
//     const year = parseInt(req.params.year, 10);
//     const currentWeek = parseInt(req.params.week, 10);
//     let totalweeksetting = await req.db.query(
//       "SELECT week FROM automation.setting_pm WHERE grup = $1 AND pmtablename = 'pm_astor'",
//       [group]
//     );

//     // Pastikan hasil query valid
//     if (!totalweeksetting || !totalweeksetting.rows) {
//       return res.status(500).json({ error: "Failed to fetch week settings" });
//     }

//     // Hitung total minggu dari setting
//     const totalWeeksSettingValue = totalweeksetting?.rows?.[0]?.week ?? 1;

//     const result = await req.db.query(
//       "SELECT * FROM automation.pm_astor WHERE grup = $1 ORDER BY no ASC",
//       [group]
//     );
//     const totalWeeks = getTotalWeeksInYear(year);

//     // Hitung range minggu (4 minggu ke depan)
//     const startWeek = currentWeek;
//     const endWeek = Math.min(
//       currentWeek + totalWeeksSettingValue - 1,
//       totalWeeks
//     );

//     const modifiedData = result.rows
//       .map((row) => {
//         // Generate data mingguan untuk seluruh tahun
//         const weeklyData = generateWeeklyDataForTargetYear(
//           totalWeeks,
//           row.periode,
//           row.periode_start,
//           year
//         );

//         // Cek apakah ada maintenance dalam rentang waktu
//         let hasMaintenanceInRange = false;
//         for (let i = startWeek; i <= endWeek; i++) {
//           if (weeklyData[`w${i}`] !== "-") {
//             hasMaintenanceInRange = true;
//             break;
//           }
//         }

//         // Return data jika ada maintenance dalam rentang
//         if (hasMaintenanceInRange) {
//           return {
//             id: row.id,
//             machine_name: row.machine_name,
//             part_kebutuhan_alat: row.part_kebutuhan_alat,
//             equipment: row.equipment,
//             kode_barang: row.kode_barang,
//             periode: row.periode,
//             grup: row.grup,
//             week: weeklyData, // Mengembalikan semua data week
//           };
//         }
//         return null;
//       })
//       .filter((item) => item !== null);

//     res.json({
//       modifiedData,
//       weeksetting: totalWeeksSettingValue,
//     });
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     res.status(500).json({ error: "Error fetching data" });
//   }
// });

// router.get("/pm_astor/filter/length/:group/:year/:week", async (req, res) => {
//   try {
//     const group = req.params.group;
//     const year = parseInt(req.params.year, 10);
//     const currentWeek = parseInt(req.params.week, 10);
//     let totalweeksetting = await req.db.query(
//       "SELECT week FROM automation.setting_pm WHERE grup = $1 AND pmtablename = 'pm_astor'",
//       [group]
//     );

//     // Pastikan hasil query valid
//     if (!totalweeksetting || !totalweeksetting.rows) {
//       return res.status(500).json({ error: "Failed to fetch week settings" });
//     }

//     // Hitung total minggu dari setting
//     const totalWeeksSettingValue = totalweeksetting?.rows?.[0]?.week ?? 1;

//     const result = await req.db.query(
//       "SELECT * FROM automation.pm_astor WHERE grup = $1 ORDER BY no ASC",
//       [group]
//     );
//     const totalWeeks = getTotalWeeksInYear(year);

//     // Hitung range minggu (4 minggu ke depan)
//     const startWeek = currentWeek;
//     const endWeek = Math.min(
//       currentWeek + totalWeeksSettingValue - 1,
//       totalWeeks
//     );
//     // Variabel untuk menghitung jumlah data yang valid
//     let totalData = 0;

//     result.rows.forEach((row) => {
//       // Generate data mingguan
//       const weeklyData = generateWeeklyDataForTargetYear(
//         totalWeeks,
//         row.periode,
//         row.periode_start,
//         year
//       );

//       // Cek apakah ada maintenance terjadwal dalam range minggu
//       let hasScheduledMaintenance = false;
//       for (let i = startWeek; i <= endWeek; i++) {
//         const weekValue = weeklyData[`w${i}`];
//         if (weekValue !== "-") {
//           hasScheduledMaintenance = true;
//           break; // Keluar dari loop jika sudah ditemukan maintenance
//         }
//       }

//       // Jika ada maintenance terjadwal, tambahkan ke counter
//       if (hasScheduledMaintenance) {
//         totalData++;
//       }
//     });

//     // Kirim hanya totalData
//     res.json({ totalData });
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     res.status(500).json({ error: "Error fetching data" });
//   }
// });

// router.post("/pm_astor/submit_pm_checklist/:grup", async (req, res) => {
//   const { year, week, data } = req.body;
//   const { grup } = req.params;

//   const grupString = grup.toString();

//   // Cek apakah year, week, dan data valid
//   if (!year || !week || !Array.isArray(data) || data.length === 0) {
//     return res.status(400).json({ error: "Data tidak valid" });
//   }

//   try {
//     // Cek apakah sudah ada data dengan week dan year yang sama
//     const checkQueryweek = `
//       SELECT 1
//       FROM automation.checklist_pm_astor
//       WHERE week = $1 AND year = $2 AND grup = $3
//       LIMIT 1;
//     `;
//     const checkResultweek = await req.db.query(checkQueryweek, [
//       week,
//       year,
//       grupString,
//     ]);

//     // Jika data sudah ada, kembalikan error
//     if (checkResultweek.rows.length > 0) {
//       return res.status(400).json({
//         error: "Data dengan week dan year yang sama sudah ada",
//       });
//     }

//     // Query untuk mengambil data dari pm_astor berdasarkan ID yang diberikan
//     const checkQuery = `
//       SELECT id, machine_name, part_kebutuhan_alat, equipment, kode_barang, no, periode, periode_start, qrcode
//       FROM automation.pm_astor
//       WHERE id = ANY($1::int[]) AND grup = $2;
//     `;
//     const checkResult = await req.db.query(checkQuery, [data, grupString]);

//     // Jika data ditemukan, lanjutkan dengan penyimpanan
//     if (checkResult.rows.length > 0) {
//       const values = checkResult.rows
//         .map(
//           (row, index) =>
//             `($${index * 12 + 1}, $${index * 12 + 2}, $${index * 12 + 3}, $${
//               index * 12 + 4
//             }, 
//             $${index * 12 + 5}, $${index * 12 + 6}, $${index * 12 + 7}, $${
//               index * 12 + 8
//             }, 
//             $${index * 12 + 9}, $${index * 12 + 10}, $${index * 12 + 11}, $${
//               index * 12 + 12
//             })`
//         )
//         .join(", ");

//       const insertQueryParams = checkResult.rows.flatMap((row) => [
//         row.id, // id dari pm_astor
//         week,
//         year,
//         grupString,
//         row.machine_name,
//         row.part_kebutuhan_alat,
//         row.equipment,
//         row.kode_barang,
//         row.no,
//         row.periode,
//         row.periode_start,
//         row.qrcode,
//       ]);

//       const insertQuery = `
//         INSERT INTO automation.checklist_pm_astor 
//         (pm_astor_id, week, year, grup, machine_name, part_kebutuhan_alat, equipment, kode_barang, no, periode, periode_start, qrcode)
//         VALUES ${values}
//         RETURNING *;
//       `;

//       // Eksekusi query untuk menyimpan data
//       const result = await req.db.query(insertQuery, insertQueryParams);

//       // Kembalikan respons sukses dengan data yang dimasukkan
//       return res.status(201).json({ success: true, insertedRows: result.rows });
//     } else {
//       // Jika data tidak ditemukan di pm_astor
//       return res
//         .status(400)
//         .json({ error: "Data tidak ditemukan di pm_astor" });
//     }
//   } catch (error) {
//     // Tangani error pada server
//     console.error(error);
//     return res.status(500).json({ error: "Terjadi kesalahan pada server" });
//   }
// });

// router.post("/pm_astor/add_astor", async (req, res) => {
//   // Validasi body request
//   const {
//     machine_name,
//     equipment,
//     kode_barang,
//     part_kebutuhan_alat,
//     qty,
//     periode,
//     periode_start,
//     grup,
//   } = req.body;

//   // Validasi field yang required
//   if (
//     !machine_name ||
//     !equipment ||
//     !kode_barang ||
//     !part_kebutuhan_alat ||
//     !qty ||
//     !periode ||
//     !periode_start ||
//     !grup
//   ) {
//     return res.status(400).json({
//       error: "Semua field harus diisi",
//     });
//   }

//   try {
//     // Cari nomor urut untuk machine_name yang sama dalam group
//     const existingMachineQuery = await req.db.query(
//       `SELECT no FROM automation.pm_astor 
//        WHERE machine_name = $1 AND grup = $2 
//        ORDER BY no DESC 
//        LIMIT 1`,
//       [machine_name, grup]
//     );

//     let machineNo;
//     if (existingMachineQuery.rowCount > 0) {
//       // Jika machine_name sudah ada, gunakan nomor yang sama
//       machineNo = existingMachineQuery.rows[0].no;
//     } else {
//       // Jika machine_name belum ada, cari nomor urut terakhir di group
//       const lastNumberQuery = await req.db.query(
//         `SELECT COALESCE(
//           (SELECT MAX(no) FROM automation.pm_astor WHERE grup = $1), 
//           0
//         ) + 1 AS last_number`,
//         [grup]
//       );

//       machineNo = lastNumberQuery.rows[0].last_number.toString();
//     }

//     // Insert data ke database
//     const result = await req.db.query(
//       `INSERT INTO automation.pm_astor 
//        (machine_name, equipment, kode_barang, part_kebutuhan_alat, qty, periode, periode_start, grup, no)
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
//        RETURNING *`,
//       [
//         machine_name,
//         equipment,
//         kode_barang,
//         part_kebutuhan_alat,
//         qty,
//         periode,
//         periode_start,
//         grup,
//         machineNo,
//       ]
//     );

//     if (result.rowCount === 0) {
//       return res.status(400).json({
//         error: "Gagal menambahkan data",
//       });
//     }

//     // Return data yang berhasil ditambahkan
//     res.status(201).json({
//       message: "Data berhasil ditambahkan",
//       data: result.rows[0],
//       machineNo: machineNo,
//     });
//   } catch (error) {
//     console.error("Error adding PM Astor data:", error);

//     // Handling specific database errors
//     if (error.code === "23505") {
//       // Unique violation
//       return res.status(400).json({
//         error: "Data dengan kode barang tersebut sudah ada",
//       });
//     }

//     res.status(500).json({
//       error: "Terjadi kesalahan saat menambahkan data",
//       details: error.message,
//     });
//   }
// });

// router.put("/pm_astor/checklist/:id", async (req, res) => {
//   const { pic, c_i, l, r, keterangan, tanggal } = req.body;

//   const { id } = req.params;

//   try {
//     // Prepare the update query (only updating the provided fields)
//     const query = `
//       UPDATE automation.checklist_pm_astor
//       SET
//         pic = $1,
//         c_i = $2,
//         l = $3,
//         r = $4,
//         keterangan = $5,
//         tanggal = $6,
//         updated_at = NOW()
//       WHERE id = $7
//       RETURNING *;
//     `;

//     // Execute the update query with the values
//     const values = [pic, c_i, l, r, keterangan, tanggal, id];

//     const result = await req.db.query(query, values);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Data not found for the given ID" });
//     }

//     // Return the updated data
//     res.status(200).json({
//       message: "Data successfully updated",
//       data: result.rows[0],
//     });
//   } catch (error) {
//     console.error("Error updating machine checklist:", error);
//     res.status(500).json({
//       error: "Failed to update checklist",
//       details: error.message,
//     });
//   }
// });

// router.delete("/pm_astor/checklist/:week/:grup", async (req, res) => {
//   const { week, grup } = req.params;
//   try {
//     // Correct the query by passing an array of parameters
//     const query = `
//       DELETE FROM automation.checklist_pm_astor WHERE week = $1 AND grup = $2
//     `;
//     const result = await req.db.query(query, [week, grup]); // Pass parameters as an array

//     if (result.rowCount === 0) {
//       // Use `rowCount` to check the number of affected rows
//       return res
//         .status(404)
//         .json({ error: "Data not found to delete for this week" });
//     }

//     // Return success message
//     res.status(200).json({
//       message: "Data successfully deleted",
//     });
//   } catch (error) {
//     console.error("Error delete machine checklist:", error);
//     res.status(500).json({
//       error: "Failed to delete checklist",
//       details: error.message,
//     });
//   }
// });

// router.put("/pm_astor/list/machine/update", async (req, res) => {
//   try {
//     const { group, machines } = req.body;
//     // Validasi input
//     if (!group || !Array.isArray(machines) || machines.length === 0) {
//       return res.status(400).json({
//         error: "Invalid input",
//         message: "Group dan daftar mesin harus disediakan",
//       });
//     }
//     try {
//       // Loop through each machine in the request
//       for (const machine of machines) {
//         // Validasi setiap mesin
//         if (!machine.name || !machine.order) {
//           console.warn(`Mesin tidak valid: ${JSON.stringify(machine)}`);
//           continue;
//         }

//         // Update nomor urutan untuk semua mesin dengan nama yang sama di group tertentu
//         const updateQuery = `
//           UPDATE automation.pm_astor 
//           SET no = $1 
//           WHERE machine_name = $2 AND grup = $3
//         `;
//         await req.db.query(updateQuery, [machine.order, machine.name, group]);

//         // Jika ada oldName, update nama mesin jika berbeda
//         if (machine.oldName && machine.name !== machine.oldName) {
//           const renameQuery = `
//             UPDATE automation.pm_astor 
//             SET machine_name = $1 
//             WHERE machine_name = $2 AND grup = $3
//           `;
//           await req.db.query(renameQuery, [
//             machine.name,
//             machine.oldName,
//             group,
//           ]);
//         }
//       }

//       res.json({
//         message: "Daftar mesin berhasil diperbarui",
//         updatedCount: machines.length,
//       });
//     } catch (error) {
//       throw error;
//     }
//   } catch (error) {
//     console.error("Error updating machine list:", error);
//     res.status(500).json({
//       error: "Gagal memperbarui daftar mesin",
//       details: error.message,
//     });
//   }
// });

// router.put("/pm_astor/update_field/:id", async (req, res) => {
//   const { id } = req.params;
//   const { field, value } = req.body;

//   // Daftar kolom yang diperbolehkan untuk diperbarui
//   const allowedFields = [
//     "machine_name",
//     "equipment",
//     "kode_barang",
//     "part_kebutuhan_alat",
//     "qty",
//     "periode",
//     "periode_start",
//   ];

//   // Validasi input untuk memastikan kolom yang akan diperbarui diizinkan
//   if (!allowedFields.includes(field)) {
//     return res.status(400).json({
//       error: "Kolom yang diberikan tidak valid atau tidak dapat diperbarui",
//     });
//   }

//   try {
//     // Jika field yang diupdate adalah machine_name
//     if (field === "machine_name") {
//       // Ambil data existing terlebih dahulu
//       const existingData = await req.db.query(
//         `SELECT grup, machine_name FROM automation.pm_astor WHERE id = $1`,
//         [id]
//       );

//       if (existingData.rowCount === 0) {
//         return res.status(404).json({ error: "Data tidak ditemukan" });
//       }

//       const { grup, machine_name: oldMachineName } = existingData.rows[0];

//       // Cari nomor urut untuk machine_name yang sama dalam group
//       const existingMachineQuery = await req.db.query(
//         `SELECT no FROM automation.pm_astor 
//          WHERE machine_name = $1 AND grup = $2 
//          ORDER BY no DESC 
//          LIMIT 1`,
//         [value, grup]
//       );

//       let machineNo;
//       if (existingMachineQuery.rowCount > 0) {
//         // Jika machine_name sudah ada, gunakan nomor yang sama
//         machineNo = existingMachineQuery.rows[0].no;
//       } else {
//         // Jika machine_name belum ada, cari nomor urut terakhir di group
//         const lastNumberQuery = await req.db.query(
//           `SELECT COALESCE(
//             (SELECT MAX(no) FROM automation.pm_astor WHERE grup = $1), 
//             0
//           ) + 1 AS last_number`,
//           [grup]
//         );

//         machineNo = lastNumberQuery.rows[0].last_number;
//       }

//       // Update machine_name dan no
//       const result = await req.db.query(
//         `UPDATE automation.pm_astor 
//          SET machine_name = $1, no = $2 
//          WHERE id = $3 RETURNING *`,
//         [value, machineNo, id]
//       );

//       if (result.rowCount === 0) {
//         return res.status(404).json({ error: "Data tidak ditemukan" });
//       }

//       // Kirimkan data yang diperbarui sebagai respons
//       return res.json({
//         message: "Machine name berhasil diperbarui",
//         data: result.rows[0],
//         machineNo: machineNo,
//       });
//     }

//     // Untuk field selain machine_name, lakukan update biasa
//     const result = await req.db.query(
//       `UPDATE automation.pm_astor SET ${field} = $1 WHERE id = $2 RETURNING *`,
//       [value, id]
//     );

//     if (result.rowCount === 0) {
//       // Jika tidak ada baris yang diperbarui, kirimkan respons 404
//       return res.status(404).json({ error: "Data tidak ditemukan" });
//     }

//     // Kirimkan data yang diperbarui sebagai respons
//     res.json({
//       message: `${field} berhasil diperbarui`,
//       data: result.rows[0],
//     });
//   } catch (error) {
//     console.error(`Error updating ${field}:`, error);
//     res.status(500).json({ error: "Terjadi kesalahan saat memperbarui data" });
//   }
// });

// // Endpoint API
// router.post("/import/astor", upload.single("file"), async (req, res) => {
//   const filePath = req.file.path;

//   try {
//     await importExcelAstor(filePath);
//     res.status(200).send("Data berhasil diimpor ke PostgreSQL.");
//   } catch (error) {
//     res.status(500).send("Gagal mengimpor data: " + error.message);
//   }
// });

// router.post("/import/astor/:grup", upload.single("file"), async (req, res) => {
//   const filePath = req.file.path;
//   const grup = req.params.grup; // Mengambil parameter grup dari URL
//   try {
//     // Anda dapat meneruskan `grup` ke fungsi `importExcelAstor` jika diperlukan
//     await importExcelAstor(filePath, grup);
//     res
//       .status(200)
//       .send(`Data untuk grup ${grup} berhasil diimpor ke PostgreSQL.`);
//   } catch (error) {
//     res
//       .status(500)
//       .send(`Gagal mengimpor data untuk grup ${grup}: ` + error.message);
//   }
// });

// router.delete("/deleted/astor/:group", async (req, res) => {
//   try {
//     // Menghapus data di database berdasarkan group
//     const group = parseInt(req.params.group, 10);
//     const result = await req.db.query(
//       "DELETE FROM automation.pm_astor WHERE grup = $1 RETURNING *",
//       [group]
//     );
//     // Mengirimkan hasil sebagai JSON, yaitu data yang telah dihapus
//     res.json({
//       message: "Data deleted successfully",
//       deletedData: result.rows,
//     });
//   } catch (error) {
//     console.error("Error deleting data:", error);
//     res.status(500).json({ error: "Error deleting data" });
//   }
// });

// router.delete("/deleted/astor_pm/batch", async (req, res) => {
//   try {
//     const { ids } = req.body;
//     console.log("Received IDs:", ids);

//     // Validasi input
//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ error: "Invalid or empty IDs array" });
//     }
//     // Pastikan semua elemen dalam array adalah number
//     if (!ids.every((id) => typeof id === "number")) {
//       return res.status(400).json({ error: "All IDs must be numbers" });
//     }
//     // Query untuk menghapus data berdasarkan IDs
//     const result = await req.db.query(
//       "DELETE FROM automation.pm_astor WHERE id = ANY($1::int[]) RETURNING *",
//       [ids]
//     );
//     console.log("Deleted rows:", result.rows);
//     // Jika tidak ada data yang dihapus
//     if (result.rowCount === 0) {
//       return res.status(404).json({
//         message: "No data found with the provided IDs",
//         deletedData: [],
//         deletedCount: 0,
//       });
//     }
//     // Response sukses
//     res.json({
//       message: "Data deleted successfully",
//       deletedData: result.rows,
//       deletedCount: result.rowCount,
//     });
//   } catch (error) {
//     console.error("Error deleting data:", error);
//     res.status(500).json({
//       error: "Error deleting data",
//       details: error.message,
//     });
//   }
// });

// router.delete("/delete_all_astor", async (req, res) => {
//   try {
//     const result = await req.db.query("DELETE FROM automation.pm_astor");
//     res.json({
//       message: "Semua data telah berhasil dihapus.",
//       affectedRows: result.rowCount,
//     });
//   } catch (error) {
//     console.error("Error deleting all data:", error);
//     res
//       .status(500)
//       .json({ error: "Terjadi kesalahan saat menghapus semua data." });
//   }
// });
// export default router;