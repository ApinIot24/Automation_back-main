import { automationDB } from "../../../src/db/automation.js";
import { generateWeeklyDataForTargetYear,getTotalWeeksInYear } from "./utilsPm.js";

export const GetWaferSelect = async (req, res) => {
  try {
    const group = parseInt(req.params.group, 10);

    const rows = await automationDB.$queryRaw`
      SELECT machine_name, no
      FROM (
        SELECT DISTINCT ON(machine_name) machine_name, no
        FROM automation.pm_wafer
        WHERE grup = ${group}
        ORDER BY machine_name, no ASC
      ) x
      ORDER BY no ASC
    `;

    res.json(rows);
  } catch (e) {
    console.error("Error in GetWaferSelect:", e)
    res.status(500).json({ error: e.message });
  }
};

export const GetWaferQRCode = async (req, res) => {
  try {
    const group = parseInt(req.params.group, 10);
    if (isNaN(group)) {
      return res.status(400).send("Invalid group parameter");
    }

    const rows = await automationDB.$queryRaw`
      SELECT DISTINCT ON(qrcode) machine_name, qrcode
      FROM automation.pm_wafer
      WHERE grup = ${group}
      ORDER BY qrcode
    `;

    res.json(rows);
  } catch (e) {
    console.error("Error in GetWaferQRCode:", e);
    res.status(500).json({ error: e.message });
  }
};

export const GetWaferListByGroupYear = async (req, res) => {
  try {
    const group = req.params.group
    const year = parseInt(req.params.year, 10);
    const start = req.query.start ? parseInt(req.query.start, 10) : null;
    const end = req.query.end ? parseInt(req.query.end, 10) : null;
    const search = req.query.searchTerm ? req.query.searchTerm.toLowerCase() : "";

    const isPaginationValid =
      start !== null && end !== null && !isNaN(start) && !isNaN(end);

    let queryArgs = {
      where: {
        grup: group,
      },
      orderBy: {
        no: "asc",
      },
    };

    if (isPaginationValid) {
      if (search) {
        queryArgs.where.OR = [
          { machine_name: { contains: search, mode: "insensitive" } },
          { kode_barang: { contains: search, mode: "insensitive" } },
          { equipment: { contains: search, mode: "insensitive" } },
          { part_kebutuhan_alat: { contains: search, mode: "insensitive" } },
        ];
      }
      queryArgs.skip = start;
      queryArgs.take = end - start + 1;
    }
    const result = await automationDB.pm_wafer.findMany(queryArgs);

    console.log("RAW RESULT:", result[0]);

    const totalWeeks = getTotalWeeksInYear(year);
    const modifiedData = result.map((row) => ({
      ...row,
      week: generateWeeklyDataForTargetYear(
        totalWeeks,
        row.periode,
        row.periode_start,
        year
      ),
    }));

    res.json(modifiedData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const GetMachineByNameAndGroup = async (req, res) => {
  try {
    const { machineName, group } = req.body;

    const rows = await automationDB.$queryRaw`
      SELECT * FROM automation.pm_wafer
      WHERE machine_name = ${machineName} AND grup = ${group}
    `;

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error fetching machine data" });
  }
};

export const GetWaferFiltered = async (req, res) => {
  try {
    const group = parseInt(req.params.group, 10);
    const year = parseInt(req.params.year, 10);
    const currentWeek = parseInt(req.params.week, 10);

    const weekSetting = await automationDB.$queryRaw`
      SELECT week FROM automation.setting_pm
      WHERE grup = ${group} AND pmtablename = 'pm_wafer'
    `;

    const range = weekSetting?.[0]?.week ?? 1;

    const rows = await automationDB.$queryRaw`
      SELECT * FROM automation.pm_wafer
      WHERE grup = ${group}
      ORDER BY no ASC
    `;

    const totalWeeks = getTotalWeeksInYear(year);
    const start = currentWeek;
    const end = Math.min(currentWeek + range - 1, totalWeeks);

    const filtered = rows
      .map(row => {
        const weekly = generateWeeklyDataForTargetYear(
          totalWeeks,
          row.periode,
          row.periode_start,
          year
        );

        const weekFiltered = {};
        let has = false;

        for (let i = start; i <= end; i++) {
          if (weekly[`w${i}`] !== "-") {
            weekFiltered[`w${i}`] = weekly[`w${i}`];
            has = true;
          }
        }

        if (!has) return null;

        return {
          id: row.id,
          machine_name: row.machine_name,
          part_kebutuhan_alat: row.part_kebutuhan_alat,
          equipment: row.equipment,
          kode_barang: row.kode_barang,
          periode: row.periode,
          grup: row.grup,
          week: weekFiltered
        };
      })
      .filter(Boolean);

    res.json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const GetWaferFilterAll = async (req, res) => {
  try {
    const group = parseInt(req.params.group, 10);
    const year = parseInt(req.params.year, 10);
    const week = parseInt(req.params.week, 10);

    const weekSetting = await automationDB.$queryRaw`
      SELECT week FROM automation.setting_pm
      WHERE grup = ${group} AND pmtablename = 'pm_wafer'
    `;

    const range = weekSetting?.[0]?.week ?? 1;

    const rows = await automationDB.$queryRaw`
      SELECT * FROM automation.pm_wafer
      WHERE grup = ${group}
      ORDER BY no ASC
    `;

    const totalWeeks = getTotalWeeksInYear(year);
    const start = week;
    const end = Math.min(week + range - 1, totalWeeks);

    const filtered = rows
      .map(row => {
        const weekly = generateWeeklyDataForTargetYear(
          totalWeeks,
          row.periode,
          row.periode_start,
          year
        );

        // check if any maintenance exists in range
        let hasMaintenance = false;
        for (let i = start; i <= end; i++) {
          if (weekly[`w${i}`] !== "-") {
            hasMaintenance = true;
            break;
          }
        }

        if (!hasMaintenance) return null;

        return {
          id: row.id,
          machine_name: row.machine_name,
          part_kebutuhan_alat: row.part_kebutuhan_alat,
          equipment: row.equipment,
          kode_barang: row.kode_barang,
          periode: row.periode,
          grup: row.grup,
          week: weekly
        };
      })
      .filter(Boolean);

    res.json({
      modifiedData: filtered,
      weeksetting: range
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};