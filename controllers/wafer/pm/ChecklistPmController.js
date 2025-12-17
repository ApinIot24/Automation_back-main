import { automationDB } from "../../../src/db/automation.js";
// import { generateWeeklyDataForTargetYear, getTotalWeeksInYear } from "./utilsPm.js";
import { generateWeeklyDataForTargetYear, getTotalWeeksInYear } from "../../../config/dateUtils.js";

export const GetChecklistFilteredData = async (req, res) => {
  try {
    const group = req.params.group;
    const year = parseInt(req.params.year, 10);
    const week = parseInt(req.params.week, 10);

    const rows = await automationDB.pm_wafer.findMany({
      where: { grup: group },
      orderBy: { no: "asc",},
    });

    const totalWeeks = getTotalWeeksInYear(year);
    const start = week;
    const end = Math.min(week, totalWeeks);

    const mapped = rows
      .map((r) => {
        const weekly = generateWeeklyDataForTargetYear(
          totalWeeks,
          r.periode,
          r.periode_start,
          year
        );

        const filtered = {};
        let has = false;

        for (let i = start; i <= end; i++) {
          const key = `w${i}`;
          if (weekly[key] && weekly[key] !== "-") {
            filtered[key] = weekly[key];
            has = true;
          }
        }

        return has
          ? {
              id: r.id,
              machine_name: r.machine_name,
              part_kebutuhan_alat: r.part_kebutuhan_alat,
              equipment: r.equipment,
              periode: r.periode,
              kode_barang: r.kode_barang,
              grup: r.grup,
              week: filtered,
            }
          : null;
      })
      .filter(Boolean);

    res.json(mapped);
  } catch (e) {
    console.error("Error fetching checklist data:", e);
    res.status(500).json({ error: e.message });
  }
};

export const GetChecklistDataFull = async (req, res) => {
  try {
    const group = req.params.group;
    const year = parseInt(req.params.year, 10);
    const currentWeek = parseInt(req.params.week, 10);

    const totalWeeks = getTotalWeeksInYear(year);

    // Ambil data checklist PM Wafer (equivalent SELECT * FROM checklist_pm_wafer)
    const rows = await automationDB.checklist_pm_wafer.findMany({
      where: {
        grup: group,
        year: year,
        week: currentWeek
      },
      orderBy: { no: "asc" },
      select: {
        id: true,
        pm_wafer_id: true,
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
        periode_start: true
      }
    });

    const startWeek = currentWeek;
    const endWeek = Math.min(currentWeek + 1, totalWeeks);
    const modifiedData = rows
      .map((row) => {
        const weeklyData = generateWeeklyDataForTargetYear(
          totalWeeks,
          row.periode,
          row.periode_start,
          year
        );

        const filteredWeeks = {};
        let hasScheduledMaintenance = false;

        // filter minggu sesuai router lama
        for (let i = startWeek; i <= endWeek; i++) {
          const v = weeklyData[`w${i}`];
          if (v !== "-") {
            filteredWeeks[`w${i}`] = v;
            hasScheduledMaintenance = true;
          }
        }

        if (!hasScheduledMaintenance) return null;

        return {
          id: row.id,
          pm_wafer_id: row.pm_wafer_id,
          status_checklist: row.status_checklist,
          pic: row.pic,
          c_i: row.c_i,
          l: row.l,
          r: row.r,
          keterangan: row.keterangan,
          foto: row.foto,
          created_at: row.created_at,
          updated_at: row.updated_at,
          week: filteredWeeks,
          year: row.year,
          machine_name: row.machine_name,
          part_kebutuhan_alat: row.part_kebutuhan_alat,
          equipment: row.equipment,
          kode_barang: row.kode_barang,
          periode: row.periode,
          grup: row.grup,
          tanggal: row.tanggal
        };
      })
      .filter(Boolean);

    res.json(modifiedData);
  } catch (error) {
    console.error("Error in GetChecklistDataFull:", error);
    res.status(500).json({ error: error.message });
  }
};

export const GetChecklistLength = async (req, res) => {
  try {
    const group = req.params.group;
    const year = parseInt(req.params.year, 10);
    const week = parseInt(req.params.week, 10);

    const setting = await automationDB.$queryRaw`
      SELECT week FROM automation.setting_pm
      WHERE grup = ${group} AND pmtablename = 'pm_wafer'
    `;

    const range = setting?.[0]?.week || 1;

    const rows = await automationDB.$queryRaw`
      SELECT * FROM automation.pm_wafer
      WHERE grup = ${group}
      ORDER BY no ASC
    `;

    const total = getTotalWeeksInYear(year);
    const start = week;
    const end = Math.min(week + range - 1, total);

    let count = 0;

    rows.forEach(r => {
      const weekly = generateWeeklyDataForTargetYear(total, r.periode, r.periode_start, year);
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
};

export const SubmitChecklistPM = async (req, res) => {
  try {
    const { year, week, data } = req.body;
    const grup = req.params.grup.toString();

    if (!year || !week || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Invalid data" });
    }

    // ==== CEK APAKAH SUDAH ADA CHECKLIST UNTUK WEEK/YEAR ====
    const exists = await automationDB.$queryRaw`
      SELECT 1 FROM automation.checklist_pm_wafer
      WHERE week=${week} AND year=${year} AND grup=${grup}
      LIMIT 1
    `;

    if (exists.length > 0) {
      return res.status(400).json({
        error: "Checklist already exists for this week/year",
      });
    }

    // ==== AMBIL DATA DARI PM_WAFER ====
    const pmData = await automationDB.$queryRaw`
      SELECT id, machine_name, part_kebutuhan_alat, equipment, kode_barang, no,
             periode, periode_start, qrcode
      FROM automation.pm_wafer
      WHERE id = ANY(${data}::int[]) AND grup = ${grup}
    `;

    if (pmData.length === 0) {
      return res.status(400).json({ error: "Invalid PM data" });
    }

    // ==== BUILD VALUES MULTIPLE ROWS ====
    const values = pmData
      .map(
        r => `(${r.id}, ${week}, ${year}, '${grup}', '${r.machine_name}', 
          '${r.part_kebutuhan_alat}', '${r.equipment}', '${r.kode_barang}',
          '${r.no}', '${r.periode}', '${r.periode_start}', '${r.qrcode}')`
      )
      .join(",");

    const insert = await automationDB.$queryRawUnsafe(`
      INSERT INTO automation.checklist_pm_wafer
      (pm_wafer_id, week, year, grup, machine_name, part_kebutuhan_alat, equipment, 
       kode_barang, no, periode, periode_start, qrcode)
      VALUES ${values}
      RETURNING *
    `);

    res.json({
      success: true,
      insertedRows: insert,
    });
  } catch (e) {
    console.error("SubmitChecklistPM error:", e);
    res.status(500).json({ error: e.message });
  }
};

export const UpdateChecklistPM = async (req, res) => {
  try {
    const { pic, c_i, l, r, keterangan, tanggal } = req.body;
    const { id } = req.params;

    // Validate that id is provided
    if (!id) {
      return res.status(400).json({
        error: "ID is required",
      });
    }

    // ID is a UUID string, not a number
    const itemId = String(id);

    const rows = await automationDB.$queryRaw`
      UPDATE automation.checklist_pm_wafer
      SET pic=${pic}, c_i=${c_i}, l=${l}, r=${r},
          keterangan=${keterangan}, tanggal=${tanggal},
          updated_at=NOW()
      WHERE id=${itemId}
      RETURNING *
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ message: "Updated", data: rows[0] });
  } catch (e) {
    console.error("Error updating machine checklist", e);
    res.status(500).json({ error: e.message });
  }
};

export const DeleteChecklistPM = async (req, res) => {
  try {
    const { week, grup } = req.params;

    const result = await automationDB.$executeRaw`
      DELETE FROM automation.checklist_pm_wafer
      WHERE week=${week} AND grup=${grup}
    `;

    if (result === 0) {
      return res.status(404).json({ error: "Data not found to delete for this week" });
    }

    res.status(200).json({
      message: "Data successfully deleted",
    });
  } catch (e) {
    console.error("Error delete machine checklist:", e);
    res.status(500).json({
      error: "Failed to delete checklist",
      details: e.message,
    });
  }
};