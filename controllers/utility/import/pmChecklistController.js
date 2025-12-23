import {
  generateWeeklyDataForTargetYear,
  getTotalWeeksInYear,
} from "../../../config/dateUtils.js";
import { automationDB } from "../../../src/db/automation.js";

export async function submitChecklistWeekUtilityByGroup(req, res) {
  try {
    const { year, week, data } = req.body;
    const grup = req.params.grup;
    const grupString = grup.toString();

    if (!year || !week || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Data tidak valid" });
    }

    // Parse week and year to integers
    const parsedWeek = parseInt(week, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedWeek) || isNaN(parsedYear)) {
      return res.status(400).json({ error: "Week dan year harus berupa angka" });
    }

    // Check duplicate submission for same week/year/group
    const exists = await automationDB.checklist_pm_utility.findFirst({
      where: { week: parsedWeek, year: parsedYear, grup: grupString },
    });

    if (exists) {
      return res.status(400).json({
        error: "Checklist untuk week & year ini sudah ada",
      });
    }

    // Get PM Utility original data
    const pmRows = await automationDB.pm_utility.findMany({
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
        .json({ error: "Data tidak ditemukan pada PM Utility" });
    }

    // Create many
    await automationDB.checklist_pm_utility.createMany({
      data: pmRows.map((r) => ({
        pm_utility_id: r.id,
        week: parsedWeek,
        year: parsedYear,
        grup,
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

    const insertedRows = await automationDB.checklist_pm_utility.findMany({
      where: { week: parsedWeek, year: parsedYear, grup: grupString },
      orderBy: { id: "asc" },
    });

    return res.status(201).json({
      success: true,
      message: "Checklist berhasil disimpan",
      insertedRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
}
// ========================== UPDATE CHECKLIST ==========================
export async function updateChecklistUtility(req, res) {
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

    const updated = await automationDB.checklist_pm_utility.update({
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
    console.error("Error updating machine checklist:", err);
    res
      .status(500)
      .json({ error: "Failed to update checklist", details: err.message });
  }
}

// ========================== DELETE CHECKLIST (BY WEEK) ==========================
export async function deleteChecklistUtilityByWeek(req, res) {
  try {
    const { week, grup } = req.params;

    // Parse week to integer
    const parsedWeek = parseInt(week, 10);
    if (isNaN(parsedWeek)) {
      return res.status(400).json({ error: "Week harus berupa angka" });
    }

    const deleted = await automationDB.checklist_pm_utility.deleteMany({
      where: { week: parsedWeek, grup },
    });

    if (deleted.count === 0) {
      return res.status(404).json({
        error: "Data not found to delete for this week",
      });
    }

    res.status(200).json({ message: "Data successfully deleted" });
  } catch (err) {
    console.error("Error delete machine checklist:", err);
    res
      .status(500)
      .json({ error: "Failed to delete checklist", details: err.message });
  }
}
// ========================== GET CHECKLIST (FILTERED) ==========================
export async function getChecklistUtilityData(req, res) {
  try {
    const { group, year, week } = req.params;
    const currentWeek = parseInt(week, 10);
    const totalWeeks = getTotalWeeksInYear(parseInt(year, 10));

    const pmRows = await automationDB.pm_utility.findMany({
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

        for (let i = startWeek; i <= endWeek; i++) {
          const val = weeklyData[`w${i}`];
          if (val !== "-") {
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
export async function getChecklistUtilitySubmitted(req, res) {
  try {
    const { group, year, week } = req.params;
    const currentWeek = parseInt(week, 10);
    const totalWeeks = getTotalWeeksInYear(parseInt(year, 10));
    const parsedYear = parseInt(year, 10);

    const rows = await automationDB.checklist_pm_utility.findMany({
      where: { grup: group, year: parsedYear, week: currentWeek },
      select: {
        id: true,
        pm_utility_id: true,
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

        for (let i = startWeek; i <= endWeek; i++) {
          const val = weeklyData[`w${i}`];
          if (val !== "-") {
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
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Error fetching data" });
  }
}
export async function getChecklistUtilityRange(req, res) {
  try {
    const { group, year, week } = req.params;
    const currentWeek = parseInt(week, 10);
    const parsedYear = parseInt(year, 10);

    const setting = await automationDB.setting_pm.findFirst({
      where: { grup: group, pmtablename: "pm_utility" },
      select: { week: true },
    });

    if (!setting) {
      return res.status(500).json({ error: "Failed to fetch week setting" });
    }

    const totalWeeksSetting = setting?.week;
    const totalWeeks = getTotalWeeksInYear(parsedYear);

    const pmRows = await automationDB.pm_utility.findMany({
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
    res.status(500).json({ error: err.message });
  }
}
export async function getChecklistUtilityAll(req, res) {
  try {
    const { group, year, week } = req.params;
    const parsedYear = parseInt(year, 10);
    const currentWeek = parseInt(week, 10);

    const setting = await automationDB.setting_pm.findFirst({
      where: { grup: group, pmtablename: "pm_utility" },
      select: { week: true },
    });
    if (!setting) {
      return res.status(500).json({ error: "Failed to fetch week setting" });
    }

    const totalWeeksSettingVal = setting?.week ?? 1;
    const totalWeeks = getTotalWeeksInYear(parsedYear);

    const pmRows = await automationDB.pm_utility.findMany({
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
        for (let i = startWeek; i <= endWeek; i++) {
          if (weeklyData[`w${i}`] !== "-") {
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
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Error fetching data" });
  }
}

export async function getChecklistUtilityCount(req, res) {
  try {
    const group = req.params.group;
    const year = parseInt(req.params.year, 10);
    const week = parseInt(req.params.week, 10);

    const setting = await automationDB.$queryRaw`
      SELECT week FROM automation.setting_pm
      WHERE grup = ${group} AND pmtablename = 'pm_utility'
    `;

    const range = setting?.[0]?.week || 1;

    const rows = await automationDB.$queryRaw`
      SELECT * FROM automation.pm_utility
      WHERE grup = ${group}
      ORDER BY no ASC
    `;

    const total = getTotalWeeksInYear(year);
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
      for (let i = start; i <= end; i++) {
        if (weekly[`w${i}`] !== "-") {
          count++;
          break;
        }
      }
    });

    res.json({ totalData: count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
