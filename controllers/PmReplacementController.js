import { automationDB } from "../src/db/automation.js";
import { generateWeeklyDataForTargetYear, getTotalWeeksInYear } from "../config/dateUtils.js";

// const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: "cahyospprt@gmail.com", // email pengirim
//         pass: "xkwojxzaccrorerw", // App password Gmail, bukan password biasa
//     },
// });

const PM_TABLE_MAP = {
  wafer: "pm_wafer",
  biscuit: "pm_biscuit",
  utility: "pm_utility",
};

function getPmTable(jenisPm) {
  const key = jenisPm?.toLowerCase();
  return PM_TABLE_MAP[key] || null;
}

export async function getPmReplaceChecklistSubmitted(req, res) {
  try {
    // const { periode_start } = req.params;

    // const rows = await automationDB.replacement_pm.findMany({
    //   where: { periode_start: periode_start },
    //   select: {
    //     id: true,
    //     no: true,
    //     machine_name: true,
    //     part_kebutuhan_alat: true,
    //     equipment: true,
    //     periode: true,
    //     grup: true,
    //     kode_barang: true,
    //     periode_start: true,
    //     seri: true,
    //     qrcode: true,
    //     jenis_pm: true,
    //   },
    //   orderBy: { no: "asc" },
    // });
    const rows = await automationDB.replacement_pm.findMany()

    res.json(rows);
  } catch (err) {
    console.error("Error fetching data Replacement:", err);
    res.status(500).json({ error: "Error fetching data" });
  }
}

export async function updatePmReplacementChecklist(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (![0, 1, 2].includes(status)) {
      return res.status(400).json({
        error: "Status tidak valid",
      });
    }

    const existing = await automationDB.replacement_pm.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({
        error: "PM Replacement Data not found",
      });
    }

    const updated = await automationDB.replacement_pm.update({
      where: { id: Number(id) },
      data: {
        status: status,
      },
    });

    res.json({
      message: "Status berhasil diupdate",
      data: updated,
    });
  } catch (err) {
    console.error("Error updating PM Replacement Data:", err);
    res.status(500).json({ error: "Error updating PM Replacement Data" });
  }
}

// export const GetPmReplacementSelect = async (req, res) => {
//   try {
//     const { group } = req.params;

//     const rows = await automationDB.$queryRaw`
//       SELECT machine_name, no
//       FROM (
//         SELECT DISTINCT ON(machine_name) machine_name, no
//         FROM automation.replacement_pm
//         WHERE grup = ${group}
//         ORDER BY machine_name, no ASC
//       ) x
//       ORDER BY no ASC
//     `;

//     res.json(rows);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// export const GetPmReplacementQRCode = async (req, res) => {
//   try {
//     const { group } = req.params;

//     const rows = await automationDB.$queryRaw`
//       SELECT DISTINCT ON(qrcode) machine_name, qrcode
//       FROM automation.replacement_pm
//       WHERE grup = ${group}
//       ORDER BY qrcode
//     `;

//     res.json(rows);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// export const GetPmReplacementListByGroupYear = async (req, res) => {
//   try {
//     const { group, year } = req.params;
//     const jenisPm = req.query.jenis_pm;
//     const start = req.query.start ? parseInt(req.query.start, 10) : null;
//     const end = req.query.end ? parseInt(req.query.end, 10) : null;
//     const search = req.query.searchTerm?.toLowerCase() || "";

//     const pmTable = getPmTable(jenisPm);
//     if (!pmTable) {
//       return res.status(400).json({ error: "Invalid jenis_pm" });
//     }

//     const isPaginationValid =
//       start !== null && end !== null && !isNaN(start) && !isNaN(end);

//     let queryArgs = {
//       where: {
//         grup: group,
//         jenis_pm: jenisPm,
//       },
//       orderBy: { no: "asc" },
//     };

//     if (isPaginationValid) {
//       if (search) {
//         queryArgs.where.OR = [
//           { machine_name: { contains: search, mode: "insensitive" } },
//           { kode_barang: { contains: search, mode: "insensitive" } },
//           { equipment: { contains: search, mode: "insensitive" } },
//           { part_kebutuhan_alat: { contains: search, mode: "insensitive" } },
//         ];
//       }
//       queryArgs.skip = start;
//       queryArgs.take = end - start + 1;
//     }

//     const result = await automationDB[pmTable].findMany(queryArgs);

//     const totalWeeks = getTotalWeeksInYear(+year);

//     const modifiedData = result.map((row) => ({
//       ...row,
//       week: generateWeeklyDataForTargetYear(
//         totalWeeks,
//         row.periode,
//         row.periode_start,
//         +year
//       ),
//     }));

//     res.json(modifiedData);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// }

// export const GetMachineByNameAndGroup = async (req, res) => {
//   try {
//     const { machineName, group } = req.body;

//     const rows = await automationDB.$queryRaw`
//       SELECT *
//       FROM automation.replacement_pm
//       WHERE machine_name = ${machineName}
//         AND grup = ${group}
//     `;

//     res.json(rows);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// }

// export const GetPmReplacementFiltered = async (req, res) => {
//   try {
//     const { group, year, week } = req.params;
//     const jenisPm = req.query.jenis_pm;

//     const pmTable = getPmTable(jenisPm);
//     if (!pmTable) {
//       return res.status(400).json({ error: "Invalid jenis_pm" });
//     }

//     const weekSetting = await automationDB.$queryRaw`
//       SELECT week FROM automation.setting_pm
//       WHERE grup = ${group}
//         AND pmtablename = ${pmTable}
//     `;

//     const range = weekSetting?.[0]?.week ?? 1;
//     const totalWeeks = getTotalWeeksInYear(+year);

//     const start = +week;
//     const end = Math.min(start + range - 1, totalWeeks);

//     const rows = await automationDB.$queryRaw`
//       SELECT *
//       FROM automation.replacement_pm
//       WHERE grup = ${group}
//         AND jenis_pm = ${jenisPm}
//       ORDER BY no ASC
//     `;

//     const filtered = rows
//       .map((row) => {
//         const weekly = generateWeeklyDataForTargetYear(
//           totalWeeks,
//           row.periode,
//           row.periode_start,
//           +year
//         );

//         let has = false;
//         const weekFiltered = {};

//         for (let i = start; i <= end; i++) {
//           if (weekly[`w${i}`] !== "-") {
//             weekFiltered[`w${i}`] = weekly[`w${i}`];
//             has = true;
//           }
//         }

//         if (!has) return null;

//         return {
//           id: row.id,
//           machine_name: row.machine_name,
//           part_kebutuhan_alat: row.part_kebutuhan_alat,
//           equipment: row.equipment,
//           kode_barang: row.kode_barang,
//           periode: row.periode,
//           grup: row.grup,
//           week: weekFiltered,
//         };
//       })
//       .filter(Boolean);

//     res.json(filtered);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// }

// export const GetPmReplacementFilterAll = async (req, res) => {
//   try {
//     const { group, year, week } = req.params;
//     const jenisPm = req.query.jenis_pm;

//     const pmTable = getPmTable(jenisPm);
//     if (!pmTable) {
//       return res.status(400).json({ error: "Invalid jenis_pm" });
//     }

//     const weekSetting = await automationDB.$queryRaw`
//       SELECT week FROM automation.setting_pm
//       WHERE grup = ${group}
//         AND pmtablename = ${pmTable}
//     `;

//     const range = weekSetting?.[0]?.week ?? 1;
//     const totalWeeks = getTotalWeeksInYear(+year);

//     const start = +week;
//     const end = Math.min(start + range - 1, totalWeeks);

//     const rows = await automationDB.$queryRaw`
//       SELECT *
//       FROM automation.replacement_pm
//       WHERE grup = ${group}
//         AND jenis_pm = ${jenisPm}
//       ORDER BY no ASC
//     `;

//     const filtered = rows
//       .map((row) => {
//         const weekly = generateWeeklyDataForTargetYear(
//           totalWeeks,
//           row.periode,
//           row.periode_start,
//           +year
//         );

//         let hasMaintenance = false;
//         for (let i = start; i <= end; i++) {
//           if (weekly[`w${i}`] !== "-") {
//             hasMaintenance = true;
//             break;
//           }
//         }

//         if (!hasMaintenance) return null;

//         return {
//           id: row.id,
//           machine_name: row.machine_name,
//           part_kebutuhan_alat: row.part_kebutuhan_alat,
//           equipment: row.equipment,
//           kode_barang: row.kode_barang,
//           periode: row.periode,
//           grup: row.grup,
//           week: weekly,
//         };
//       })
//       .filter(Boolean);

//     res.json({
//       modifiedData: filtered,
//       weeksetting: range,
//     });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// }