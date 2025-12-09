export const getDowntimeDailyRange = async (req, res) => {
  try {
    const { startDate, endDate, line } = req.params;

    const query = `
      SELECT 
        dt.id AS downtime_id,
        dt.time_start,
        dt.time_stop,
        dt.total_dt,
        dt.kendala,
        dt.unit_mesin,
        dt.part_mesin,
        dt.penyebab,
        dt.perbaikan,
        lhp.grup,
        lhp.users_input,
        TO_CHAR(lhp.realdatetime, 'YYYY-MM-DD') AS realdatetime
      FROM automation.downtime dt
      JOIN automation.lhp lhp
        ON dt.id_lhp = lhp.id
      WHERE lhp.realdatetime BETWEEN $1 AND $2
        AND lhp.grup = $3
      ORDER BY dt.id ASC;
    `;

    const result = await automationDB.$queryRawUnsafe(query, startDate, endDate, line);
    return res.json(result);
  } catch (error) {
    console.error("Error fetching downtime range:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDowntimeDailyRangeL5 = async (req, res) => {
  try {
    const { startDate, endDate, line } = req.params;

    const query = `
      SELECT 
        dt.id AS downtime_id,
        dt.time_start,
        dt.time_stop,
        dt.total_dt,
        dt.kendala,
        dt.unit_mesin,
        dt.part_mesin,
        dt.penyebab,
        dt.perbaikan,
        lhp.grup,
        lhp.users_input,
        TO_CHAR(lhp.realdatetime, 'YYYY-MM-DD') AS realdatetime
      FROM automation.downtime_l5 dt
      JOIN automation.lhp_l5 lhp
        ON dt.id_lhp = lhp.id
      WHERE lhp.realdatetime BETWEEN $1 AND $2
        AND lhp.grup = $3
      ORDER BY dt.id ASC;
    `;

    const result = await automationDB.$queryRawUnsafe(query, startDate, endDate, line);
    return res.json(result);
  } catch (error) {
    console.error("Error fetching downtime L5:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getLastDowntimeL1 = async (req, res) => {
  try {
    const query = `
      SELECT *
      FROM automation.downtime_l1
      ORDER BY id DESC
      LIMIT 1;
    `;

    const result = await automationDB.$queryRawUnsafe(query);
    return res.json(result);
  } catch (error) {
    console.error("Error fetching last downtime L1:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};