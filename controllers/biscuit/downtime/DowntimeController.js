import { rawAutomation as raw } from "../../../config/sqlRaw.js";

export async function getDowntimeDailyRange(req, res) {
  try {
    const { startDate, endDate, line } = req.params;

    const result = await raw(
      `
        SELECT 
            downtime_l5.id AS downtime_id,
            downtime_l5.time_start, 
            downtime_l5.time_stop, 
            downtime_l5.total_dt, 
            downtime_l5.kendala,
            downtime_l5.unit_mesin,
            downtime_l5.part_mesin,
            lhp_l5.grup, 
            lhp_l5.users_input, 
            TO_CHAR(lhp_l5.realdatetime, 'YYYY-MM-DD') AS realdatetime
        FROM 
            automation.downtime_l5
        JOIN 
            automation.lhp_l5
        ON 
            downtime_l5.id_lhp::integer = lhp_l5.id
        WHERE 
            lhp_l5.realdatetime BETWEEN $1 AND $2
            AND lhp_l5.grup = $3
        ORDER BY 
            downtime_l5.id ASC
      `,
      startDate,
      endDate,
      line
    );

    res.json(result);
  } catch (err) {
    console.error("Error fetching downtime data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
