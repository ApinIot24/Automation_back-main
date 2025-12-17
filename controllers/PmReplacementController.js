import { automationDB } from "../src/db/automation.js";
import { generateWeeklyDataForTargetYear, getTotalWeeksInYear } from "../config/dateUtils.js";

// const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: "cahyospprt@gmail.com", // email pengirim
//         pass: "xkwojxzaccrorerw", // App password Gmail, bukan password biasa
//     },
// });

// const PM_TABLE_MAP = {
//   wafer: "pm_wafer",
//   biscuit: "pm_biscuit",
//   utility: "pm_utility",
// };

// function getPmTable(jenisPm) {
//   const key = jenisPm?.toLowerCase();
//   return PM_TABLE_MAP[key] || null;
// }

export async function getPmReplaceChecklistSubmitted(req, res) {
  try {
    const { group, year } = req.params;
    const { jenis_pm } = req.query;


    const parsedYear = Number(year);
    const stringGroup = String(group);
    const jenis = String(jenis_pm).toLowerCase();

    if (!stringGroup || !jenis || !Number.isInteger(parsedYear)) {
      return res.status(400).json({ error: "Invalid params" });
    }

    const rows = await automationDB.replacement_pm.findMany({
      where: {
        grup: stringGroup,
        jenis_pm: jenis, // ✅ FILTER UTAMA
      },
      orderBy: { no: "asc" },
    });

    const totalWeeks = getTotalWeeksInYear(parsedYear);

    // const mapped = rows.map((r) => ({
    //   ...r,
    //   confirm_week: generateWeeklyDataForTargetYear(
    //     totalWeeks,
    //     r.periode,
    //     r.periode_start,
    //     parsedYear
    //   ),
    // }));
    const mapped = rows.map((r) => {
      const rawWeeks = String(r.periode_start || '')
        .split(',')
        .map(w => w.trim())
        .filter(Boolean);

      const weekNumbers = rawWeeks.map(w =>
        Number(w.replace(/^.*w/i, ''))
      );

      return {
        ...r,
        confirm_week: weekNumbers,
        confirm_week_label: rawWeeks,
      };
    });
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching Replacement PM:", err);
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