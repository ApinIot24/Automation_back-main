import { automationDB } from "../src/db/automation.js";
import { generateWeeklyDataForTargetYear, getTotalWeeksInYear } from "../config/dateUtils.js";

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
      // weektargetreal = target asli dari database
      const weektargetreal = r.target_week && r.target_year 
        ? `${r.target_year}w${r.target_week}`
        : null;

       // confirm_week dan confirm_week_label = hanya week terakhir (target + 4 minggu)
       let confirm_week = [];
       let confirm_week_label = [];

       if (r.target_week && r.target_year) {
         const targetWeek = parseInt(r.target_week, 10);
         const targetYear = parseInt(r.target_year, 10);
         
         if (!isNaN(targetWeek) && !isNaN(targetYear)) {
           // Hitung 4 minggu ke depan dari target week, ambil hanya week terakhir
           // Contoh: Week 52 (2025) → Week 4 (2026) = 52 + 4 = 56, tapi karena max 52, jadi 4 di tahun 2026
           // Contoh: Week 5 (2026) → Week 9 (2026) = 5 + 4 = 9
           let w = targetWeek;
           let y = targetYear;
           
           // Tambahkan 4 minggu
           for (let i = 0; i < 4; i++) {
             w++;
             const max = getTotalWeeksInYear(y);
             
             // Jika week melebihi max weeks di tahun tersebut, pindah ke tahun berikutnya
             if (w > max) {
               w = 1;
               y++;
             }
           }
           
           // Hanya ambil week terakhir
           confirm_week.push(w);
           confirm_week_label.push(`${y}w${w}`);
         }
       }

      return {
        ...r,
        confirm_week,
        confirm_week_label,
        weektargetreal, // Target asli dari database: "2026w5"
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