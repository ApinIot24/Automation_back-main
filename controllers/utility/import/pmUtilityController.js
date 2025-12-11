import { generateWeeklyDataForTargetYear, getTotalWeeksInYear } from "../../../config/dateUtils.js";
import { automationDB } from "../../../src/db/automation.js";

export async function getPmUtilityGroupingByYear(req, res) {
  try {
    const { group, year } = req.params;

    const start = req.query.start ? parseInt(req.query.start, 10) : null;
    const end = req.query.end ? parseInt(req.query.end, 10) : null;
    const searchTerm = req.query.searchTerm
      ? req.query.searchTerm.toLowerCase()
      : "";

    let data = [];

    // ========== CASE 1: PAKAI PAGINATION + SEARCH ==========
    if (start !== null && end !== null && !isNaN(start) && !isNaN(end)) {
      data = await automationDB.pm_utility.findMany({
        where: {
          grup: group,
          OR: [
            { machine_name: { contains: searchTerm, mode: "insensitive" } },
            { kode_barang: { contains: searchTerm, mode: "insensitive" } },
            { equipment: { contains: searchTerm, mode: "insensitive" } },
            { part_kebutuhan_alat: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        orderBy: { no: "asc" },
        skip: start,
        take: end - start + 1,
      });
    }

    // ========== CASE 2: TANPA PAGINATION ==========
    else {
      data = await automationDB.pm_utility.findMany({
        where: { grup: group },
        orderBy: { no: "asc" },
      });
    }

    // ================== WEEK PROCESS =====================
    const totalWeeks = getTotalWeeksInYear(parseInt(year));

    const modifiedData = data.map((row) => ({
      ...row,
      week: generateWeeklyDataForTargetYear(
        totalWeeks,
        row.periode,
        row.periode_start,
        parseInt(year)
      ),
    }));

    return res.json(modifiedData);
  } catch (error) {
    console.error("Error fetching pm_utility:", error);
    return res.status(500).json({ error: "Error fetching data" });
  }
}