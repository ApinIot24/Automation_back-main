// controllers/pmBiscuit/pmChecklist.controller.js
import { automationDB } from "../../../src/db/automation.js";
import {
  generateWeeklyDataForTargetYear,
  getTotalWeeksInYear,
} from "../../../config/dateUtils.js";
// ========================== SUBMIT CHECKLIST ==========================
export async function submitChecklistWeekByGroup(req, res) {
  try {
    const { year, week, data } = req.body;
    const grup = req.params.grup;
    const grupString = grup.toString();
    const weekNumber = Number(week);
    const yearNumber = Number(year);

    if (!yearNumber || !weekNumber || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Data tidak valid" });
    }

    // Check duplicate submission for same week/year/group
    const exists = await automationDB.checklist_pm_biscuit.findFirst({
      where: { week: weekNumber, year: yearNumber, grup: grupString },
    });

    if (exists) {
      return res.status(400).json({
        error: "Checklist untuk week & year ini sudah ada",
      });
    }

    // Get PM Biscuit original data
    const pmRows = await automationDB.pm_biscuit.findMany({
      where: { id: { in: data }, grup: grupString },
      select: {
        id: true,
        machine_name: true,
        part_kebutuhan_alat: true,
        equipment: true,
        kode_barang: true,
        no: true,
        periode: true,
        periode_start: true,
        qrcode: true,
      },
    });

    if (pmRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Data tidak ditemukan pada PM Biscuit" });
    }

    // Create many
    await automationDB.checklist_pm_biscuit.createMany({
      data: pmRows.map((r) => ({
        pm_biscuit_id: r.id,
        week: weekNumber,
        year: yearNumber,
        grup: grupString,
        machine_name: r.machine_name,
        part_kebutuhan_alat: r.part_kebutuhan_alat,
        equipment: r.equipment,
        kode_barang: r.kode_barang,
        no: r.no,
        periode: r.periode,
        periode_start: r.periode_start,
        qrcode: r.qrcode,
      })),
    });

    const insertedRows = await automationDB.checklist_pm_biscuit.findMany({
      where: { week: weekNumber, year: yearNumber, grup: grupString },
      orderBy: { id: "asc" },
    });

    return res.status(201).json({
      success: true,
      message: "Checklist berhasil disimpan",
      insertedRows,
    });
  } catch (err) {
    console.error("Error in submitChecklistWeekByGroup:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: err.message || "Terjadi kesalahan pada server",
      details: {
        grup: req.params.grup,
        year: req.body.year,
        week: req.body.week,
        errorName: err.name,
        errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  }
}

// ========================== UPDATE CHECKLIST ==========================
export async function updateChecklist(req, res) {
  try {
    const { id } = req.params;
    const { pic, c_i, l, r, keterangan, tanggal } = req.body;

    // Validate that id is provided
    if (!id) {
      return res.status(400).json({
        error: "ID is required",
      });
    }

    // ID is a UUID string, not a number
    const itemId = String(id);

    const updated = await automationDB.checklist_pm_biscuit.update({
      where: { id: itemId },
      data: {
        pic,
        c_i,
        l,
        r,
        keterangan,
        tanggal: tanggal ?? null,
        updated_at: new Date(),
      },
    });

    if (!updated) {
      return res.status(404).json({ error: "Data not found for the given ID" });
    }

    res.status(200).json({
      message: "Checklist berhasil diupdate",
      data: updated,
    });
  } catch (err) {
    console.error("Error in updateChecklist:", err);
    console.error("Error stack:", err.stack);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Data not found for the given ID" });
    }
    res.status(500).json({ 
      error: err.message || "Error updating checklist",
      details: {
        id: req.params.id,
        errorName: err.name,
        errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  }
}

// ========================== DELETE CHECKLIST (BY WEEK) ==========================
export async function deleteChecklistByWeek(req, res) {
  try {
    const { week, grup } = req.params;

    const deleted = await automationDB.checklist_pm_biscuit.deleteMany({
      where: { week: week, grup },
    });

    if (deleted.count === 0) {
      return res.status(404).json({
        error: "Data not found to delete for this week",
      });
    }

    res.status(200).json({ message: "Data successfully deleted" });
  } catch (err) {
    console.error("Error in deleteChecklistByWeek:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: err.message || "Failed to delete checklist",
      details: {
        week: req.params.week,
        grup: req.params.grup,
        errorName: err.name,
        errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  }
}

// ========================== GET CHECKLIST (FILTERED) ==========================
export async function getChecklistData(req, res) {
  try {
    const { group, year, week } = req.params;
    const parsedYear = parseInt(year, 10);
    const currentWeek = parseInt(week, 10);

    if (isNaN(parsedYear) || isNaN(currentWeek)) {
      return res.status(400).json({ 
        error: "Invalid year or week parameter",
        details: { year: req.params.year, week: req.params.week }
      });
    }

    const totalWeeks = getTotalWeeksInYear(parsedYear);

    if (currentWeek < 1 || currentWeek > totalWeeks) {
      return res.status(400).json({ 
        error: `Week must be between 1 and ${totalWeeks} for year ${parsedYear}`,
        details: { currentWeek, totalWeeks, parsedYear }
      });
    }

    const pmRows = await automationDB.pm_biscuit.findMany({
      where: { grup: group },
      orderBy: { no: "asc" },
    });

    const startWeek = currentWeek;
    const endWeek = Math.min(currentWeek, totalWeeks);

    const modifiedData = pmRows
      .map((row) => {
        const weeklyData = generateWeeklyDataForTargetYear(
          totalWeeks,
          row.periode,
          row.periode_start,
          parseInt(year, 10)
        );

        let filteredWeeks = {};
        let hasData = false;

        for (let i = startWeek; i <= endWeek && i <= totalWeeks; i++) {
          const val = weeklyData[`w${i}`];
          if (val && val !== "-") {
            filteredWeeks[`w${i}`] = val;
            hasData = true;
          }
        }

        return hasData
          ? {
              id: row.id,
              machine_name: row.machine_name,
              part_kebutuhan_alat: row.part_kebutuhan_alat,
              equipment: row.equipment,
              periode: row.periode,
              kode_barang: row.kode_barang,
              grup: row.grup,
              week: filteredWeeks,
            }
          : null;
      })
      .filter((item) => item !== null);

    res.json(modifiedData);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Error fetching data" });
  }
}

export async function getChecklistSubmitted(req, res) {
  try {
    const { group, year, week } = req.params;
    const parsedYear = parseInt(year, 10);
    const currentWeek = parseInt(week, 10);

    if (isNaN(parsedYear) || isNaN(currentWeek)) {
      return res.status(400).json({ 
        error: "Invalid year or week parameter",
        details: { year: req.params.year, week: req.params.week }
      });
    }

    const totalWeeks = getTotalWeeksInYear(parsedYear);

    if (currentWeek < 1 || currentWeek > totalWeeks) {
      return res.status(400).json({ 
        error: `Week must be between 1 and ${totalWeeks} for year ${parsedYear}`,
        details: { currentWeek, totalWeeks, parsedYear }
      });
    }

    const rows = await automationDB.checklist_pm_biscuit.findMany({
      where: { grup: group, year: parsedYear, week: currentWeek },
      select: {
        id: true,
        pm_biscuit_id: true,
        status_checklist: true,
        pic: true,
        c_i: true,
        l: true,
        r: true,
        keterangan: true,
        foto: true,
        created_at: true,
        updated_at: true,
        week: true,
        year: true,
        tanggal: true,
        no: true,
        machine_name: true,
        part_kebutuhan_alat: true,
        equipment: true,
        periode: true,
        grup: true,
        kode_barang: true,
        periode_start: true,
      },
      orderBy: { no: "asc" },
    });

    const startWeek = currentWeek;
    const endWeek = Math.min(currentWeek + 1, totalWeeks);

    const modifiedData = rows
      .map((row) => {
        const weeklyData = generateWeeklyDataForTargetYear(
          totalWeeks,
          row.periode,
          row.periode_start,
          parsedYear
        );

        let filtered = {};
        let hasData = false;

        for (let i = startWeek; i <= endWeek && i <= totalWeeks; i++) {
          const val = weeklyData[`w${i}`];
          if (val && val !== "-") {
            filtered[`w${i}`] = val;
            hasData = true;
          }
        }

        return hasData
          ? {
              ...row,
              week: filtered,
            }
          : null;
      })
      .filter((item) => item !== null);

    res.json(modifiedData);
  } catch (err) {
    console.error("Error in getChecklistSubmitted:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: err.message || "Error fetching data",
      details: {
        group: req.params.group,
        year: req.params.year,
        week: req.params.week,
        errorName: err.name,
        errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  }
}

export async function getChecklistRange(req, res) {
  try {
    const { group, year, week } = req.params;
    const currentWeek = parseInt(week, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(currentWeek) || isNaN(parsedYear)) {
      return res.status(400).json({ 
        error: "Invalid week or year parameter",
        details: { week, year, parsedWeek: currentWeek, parsedYear }
      });
    }

    const setting = await automationDB.setting_pm.findFirst({
      where: { grup: group, pmtablename: "pm_biscuit" },
      select: { week: true },
    });

    if (!setting) {
      return res.status(500).json({ 
        error: "Failed to fetch week setting",
        details: { group, pmtablename: "pm_biscuit" }
      });
    }

    const totalWeeksSetting = setting?.week ?? 1;
    const totalWeeks = getTotalWeeksInYear(parsedYear);

    if (currentWeek < 1 || currentWeek > totalWeeks) {
      return res.status(400).json({ 
        error: `Week must be between 1 and ${totalWeeks} for year ${parsedYear}`,
        details: { currentWeek, totalWeeks, parsedYear }
      });
    }

    const pmRows = await automationDB.pm_biscuit.findMany({
      where: { grup: group },
      orderBy: { no: "asc" },
    });

    const startWeek = currentWeek;
    const endWeek = Math.min(currentWeek + totalWeeksSetting - 1, totalWeeks);

    const response = pmRows
      .map((row) => {
        const weeklyData = generateWeeklyDataForTargetYear(
          totalWeeks,
          row.periode,
          row.periode_start,
          parsedYear
        );

        let filtered = {};
        let hasData = false;

        for (let i = startWeek; i <= endWeek; i++) {
          const val = weeklyData[`w${i}`];
          if (val !== "-") {
            filtered[`w${i}`] = val;
            hasData = true;
          }
        }

        return hasData
          ? {
              id: row.id,
              machine_name: row.machine_name,
              part_kebutuhan_alat: row.part_kebutuhan_alat,
              equipment: row.equipment,
              periode: row.periode,
              kode_barang: row.kode_barang,
              grup: row.grup,
              week: filtered,
            }
          : null;
      })
      .filter((item) => item !== null);

    res.json(response);
  } catch (err) {
    console.error("Error in getChecklistRange:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: err.message || "Error fetching data",
      details: {
        group: req.params.group,
        year: req.params.year,
        week: req.params.week,
        errorName: err.name,
        errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  }
}

export async function getChecklistAll(req, res) {
  try {
    const { group, year, week } = req.params;
    const parsedYear = parseInt(year, 10);
    const currentWeek = parseInt(week, 10);

    if (isNaN(currentWeek) || isNaN(parsedYear)) {
      return res.status(400).json({ 
        error: "Invalid week or year parameter",
        details: { week, year, parsedWeek: currentWeek, parsedYear }
      });
    }

    const setting = await automationDB.setting_pm.findFirst({
      where: { grup: group, pmtablename: "pm_biscuit" },
      select: { week: true },
    });
    if (!setting) {
      return res.status(500).json({ 
        error: "Failed to fetch week setting",
        details: { group, pmtablename: "pm_biscuit" }
      });
    }

    const totalWeeksSettingVal = setting?.week ?? 1;
    const totalWeeks = getTotalWeeksInYear(parsedYear);

    if (currentWeek < 1 || currentWeek > totalWeeks) {
      return res.status(400).json({ 
        error: `Week must be between 1 and ${totalWeeks} for year ${parsedYear}`,
        details: { currentWeek, totalWeeks, parsedYear }
      });
    }

    const pmRows = await automationDB.pm_biscuit.findMany({
      where: { grup: group },
      orderBy: { no: "asc" },
    });

    const startWeek = currentWeek;
    const endWeek = Math.min(
      currentWeek + totalWeeksSettingVal - 1,
      totalWeeks
    );

    const modifiedData = pmRows
      .map((row) => {
        const weeklyData = generateWeeklyDataForTargetYear(
          totalWeeks,
          row.periode,
          row.periode_start,
          parsedYear
        );

        // check if ANY week in range has data
        let hasMaintenance = false;
        for (let i = startWeek; i <= endWeek && i <= totalWeeks; i++) {
          const val = weeklyData[`w${i}`];
          if (val && val !== "-") {
            hasMaintenance = true;
            break;
          }
        }

        return hasMaintenance
          ? {
              id: row.id,
              machine_name: row.machine_name,
              part_kebutuhan_alat: row.part_kebutuhan_alat,
              equipment: row.equipment,
              kode_barang: row.kode_barang,
              periode: row.periode,
              grup: row.grup,
              week: weeklyData,
            }
          : null;
      })
      .filter((item) => item !== null);

    res.json({
      modifiedData,
      weeksetting: totalWeeksSettingVal,
    });
  } catch (err) {
    console.error("Error in getChecklistAll:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: err.message || "Error fetching data",
      details: {
        group: req.params.group,
        year: req.params.year,
        week: req.params.week,
        errorName: err.name,
        errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  }
}

export async function getChecklistCount(req, res) {
  try {
    const group = req.params.group;
    const year = parseInt(req.params.year, 10);
    const week = parseInt(req.params.week, 10);

    if (isNaN(year) || isNaN(week)) {
      return res.status(400).json({ 
        error: "Invalid year or week parameter",
        details: { year: req.params.year, week: req.params.week }
      });
    }

    const setting = await automationDB.$queryRaw`
      SELECT week FROM automation.setting_pm
      WHERE grup = ${group} AND pmtablename = 'pm_biscuit'
    `;

    const range = setting?.[0]?.week || 1;

    const rows = await automationDB.$queryRaw`
      SELECT * FROM automation.pm_biscuit
      WHERE grup = ${group}
      ORDER BY no ASC
    `;

    const total = getTotalWeeksInYear(year);
    
    if (week < 1 || week > total) {
      return res.status(400).json({ 
        error: `Week must be between 1 and ${total} for year ${year}`,
        details: { week, total, year }
      });
    }

    const start = week;
    const end = Math.min(week + range - 1, total);

    let count = 0;

    rows.forEach((r) => {
      const weekly = generateWeeklyDataForTargetYear(
        total,
        r.periode,
        r.periode_start,
        year
      );
      for (let i = start; i <= end && i <= total; i++) {
        const val = weekly[`w${i}`];
        if (val && val !== "-") {
          count++;
          break;
        }
      }
    });

    res.json({ totalData: count });
  } catch (err) {
    console.error("Error in getChecklistCount:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: err.message || "Error fetching checklist count",
      details: {
        group: req.params.group,
        year: req.params.year,
        week: req.params.week,
        errorName: err.name,
        errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  }
}

