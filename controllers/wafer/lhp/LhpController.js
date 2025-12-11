import { parseTimeToISO, serializeBigInt } from "../../../config/sqlRaw.js";
import { automationDB } from "../../../src/db/automation.js";

export const createLHP = async (req, res) => {
  try {
    const {
      realdatetime,
      grup,
      shift,
      sku,
      plan,
      real,
      ach,
      cello,
      cellocpp,
      ctn_type,
      cello_used,
      adonan_used,
      ccbcream_used,
      avgsheet,
      avgbook,
      sheet,
      book,
      cutkasar,
      bubukcutting,
      sapuancut,
      qcpacking,
      qccello,
      packing_reject,
      banded,
      sapuanpack,
      buble,
      suppliercello,
      speed_mesin,
      sample_ctn_qc,
      banded_under,
      banded_over,
      cutoff_jam,
      ctn_luar,
      d_b,
      plastik_pof,
      coklat_used,
      sortir,
      pof_kue,
      users_input,
      uh,
      hadir,
      jam_kerja,
      jenis_adonan,
      give_ado,
      give_cream,
      give_cello,
      rej_ado,
      rej_cream,
      wip_kg,
      book_kotor,
      bs_cello,
      pakai_ctn,
      bs_cpp_roll,
      mc_quality,
      sbl_ls_es,
      sbl_tbd,
      sbl_sua,
      sbl_ims,
      sbl_rs,
      downtime = [],
    } = req.body;

    const existing = await automationDB.lhp.findFirst({
      where: {
        realdatetime,
        shift,
        grup,
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "Data already exists for this date and shift.",
      });
    }

    const newLhp = await automationDB.lhp.create({
      data: {
        realdatetime,
        grup,
        shift,
        sku,
        plan,
        real,
        ach,
        cello,
        cellocpp,
        ctn_type,
        cello_used,
        adonan_used,
        ccbcream_used,
        avgsheet,
        avgbook,
        sheet,
        book,
        cutkasar,
        bubukcutting,
        sapuancut,
        qcpacking,
        qccello,
        packing_reject,
        banded,
        sapuanpack,
        buble,
        suppliercello,
        speed_mesin,
        sample_ctn_qc,
        banded_under,
        banded_over,
        cutoff_jam,
        ctn_luar,
        d_b,
        plastik_pof,
        coklat_used,
        sortir,
        pof_kue,
        users_input,
        uh,
        hadir,
        jam_kerja,
        jenis_adonan,
        give_ado,
        give_cream,
        give_cello,
        rej_ado,
        rej_cream,
        wip_kg,
        book_kotor,
        bs_cello,
        pakai_ctn,
        bs_cpp_roll,
        mc_quality,
        sbl_ls_es,
        sbl_tbd,
        sbl_sua,
        sbl_ims,
        sbl_rs,
      },
    });

    const idLhp = newLhp.id;
    const todayDate = realdatetime.split("T")[0]; // "2025-12-10"

    const kendalaJson = {};
    downtime.forEach((dt, i) => {
      // kendalaJson[`kendala${i + 1}`] =
      //   `Time Start: ${dt.time_start}, Time Stop: ${dt.time_stop}, ` +
      //   `Total DT: ${dt.total_dt}, Kendala: ${dt.kendala}, ` +
      //   `Unit Mesin: ${dt.unit_mesin}, Part Mesin: ${dt.part_mesin}`;
      kendalaJson[`kendala${i + 1}`] = {
        time_start: parseTimeToISO(todayDate, dt.time_start),
        time_stop: parseTimeToISO(todayDate, dt.time_stop),
        total_dt: dt.total_dt && dt.total_dt.toString().trim() !== "" 
                  ? String(dt.total_dt) 
                  : "0",
        kendala: dt.kendala,
        unit_mesin: dt.unit_mesin,
        part_mesin: dt.part_mesin,
      };
    });

    await automationDB.lhp.update({
      where: { id: idLhp },
      data: { kendala: kendalaJson },
    });

    const validDowntime = downtime.filter(
      (dt) =>
        (dt.time_start && dt.time_start.toString().trim() !== "") ||
        (dt.time_stop && dt.time_stop.toString().trim() !== "") ||
        (dt.total_dt && dt.total_dt.toString().trim() !== "") ||
        (dt.kendala && dt.kendala.toString().trim() !== "")
    );

    if (validDowntime.length > 0) {
      await automationDB.downtime.createMany({
        data: validDowntime.map((dt) => ({
          id_lhp: idLhp,
          time_start: parseTimeToISO(todayDate, dt.time_start),
          time_stop: parseTimeToISO(todayDate, dt.time_stop),
          total_dt: dt.total_dt && dt.total_dt.toString().trim() !== "" 
                    ? String(dt.total_dt) 
                    : "0",
          kategori_downtime: dt.kategori_downtime,
          unit_mesin: dt.unit_mesin,
          part_mesin: dt.part_mesin,
          kendala: dt.kendala,
          speed_oven_plan: dt.speed_oven_plan,
          speed_oven_reduce: dt.speed_oven_reduce,
          total_sbl: dt.total_sbl,
          perbaikan: dt.perbaikan,
          penyebab: dt.penyebab,
        })),
      });
    }

    return res.status(201).json({ id: idLhp });
  } catch (error) {
    console.error("Error inserting data LHP:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while saving data." });
  }
}
export const getLastLHP = async (req, res) => {
  try {
    const data = await automationDB.lhp.findMany({
      orderBy: { id: "desc" },
      take: 1,
    });

    return res.json(data);
  } catch (error) {
    console.error("Error getLastLHP:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
export const getLHPDetail = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const data = await automationDB.lhp.findUnique({
      where: { id },
    });

    if (!data) {
      return res.status(404).json({ message: "LHP not found" });
    }

    return res.json(data);
  } catch (error) {
    console.error("Error getLHPDetail:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getDailyLHP = async (req, res) => {
  try {
    const line = req.params.line;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const data = await automationDB.lhp.findMany({
      where: {
        realdatetime: {gte: start, lte: end},
        grup: line,
        shift: "1",
      },
      orderBy: { id: "asc" },
    });

    return res.json(data);
  } catch (error) {
    console.error("Error getDailyLHP:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getDailyLHPByDate = async (req, res) => {
    try {
        const {date, line} = req.params;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                error: "Invalid date format. Use YYYY-MM-DD.",
            });
        }
        const parsedDate = new Date(date)
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                error: "Invalid date. Please provide a real date.",
            });
        }
        const formattedDate = parsedDate.toISOString().split('T')[0];

        if (!line || typeof line !== "string" || line.trim() === "") {
            return res.status(400).json({
                error: "Invalid line parameter. Must be a non-empty string.",
            })
        }

        const query = `
            WITH shifts AS (
  SELECT '1' AS shift 
  UNION ALL 
  SELECT '2' 
  UNION ALL 
  SELECT '3'
),
dates AS (
  SELECT DISTINCT realdatetime::date AS realdatetime 
  FROM automation.lhp 
  WHERE realdatetime::date = $1
),
all_combinations AS (
  SELECT d.realdatetime, s.shift 
  FROM dates d 
  CROSS JOIN shifts s
)
SELECT
  COALESCE(sd.id, ROW_NUMBER() OVER (PARTITION BY ac.realdatetime ORDER BY ac.shift)) AS id,
  ac.realdatetime,
  ac.shift,
  ${[
    "grup",
    "shift",
    "sku",
    "plan",
    "real",
    "ach",
    "cello",
    "cellocpp",
    "ctn_type",
    "cello_used",
    "adonan_used",
    "ccbcream_used",
    "avgsheet",
    "avgbook",
    "sheet",
    "book",
    "cutkasar",
    "bubukcutting",
    "sapuancut",
    "qcpacking",
    "qccello",
    "packing_reject",
    "banded",
    "sapuanpack",
    "buble",
    "suppliercello",
    "speed_mesin",
    "sample_ctn_qc",
    "banded_under",
    "banded_over",
    "cutoff_jam",
    "ctn_luar",
    "d_b",
    "plastik_pof",
    "coklat_used",
    "sortir",
    "pof_kue",
    "users_input",
    "uh",
    "hadir",
    "jam_kerja",
    "jenis_adonan",
    "give_ado",
    "give_cream",
    "give_cello",
    "rej_ado",
    "rej_cream",
    "wip_kg",
    "book_kotor",
    "bs_cello",
    "pakai_ctn",
    "bs_cpp_roll",
    "mc_quality",
    "sbl_ls_es",
    "sbl_tbd",
    "sbl_sua",
    "sbl_ims",
    "sbl_rs",
  ]
    .map((col) => `COALESCE(sd.${col}, '0') AS ${col}`)
    .join(",\n  ")}
FROM all_combinations ac
LEFT JOIN automation.lhp sd 
  ON ac.realdatetime = sd.realdatetime 
  AND ac.shift = sd.shift 
  AND sd.grup = $2
ORDER BY ac.realdatetime, ac.shift;
        `

        const result = await automationDB.$queryRawUnsafe(query, formattedDate, line);

        return res.json(serializeBigInt(result));
    } catch (error) {
        console.error("Error executing getDailyLHPByDate:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const createLHPL7 = async (req, res) => {
  try {
    const {
      realdatetime,
      grup,
      shift,
      sku,
      plan,
      real,
      ach,
      cello,
      cellocpp,
      ctn_type,
      cello_used,
      adonan_used,
      ccbcream_used,
      avgsheet,
      avgbook,
      sheet,
      book,
      cutkasar,
      bubukcutting,
      sapuancut,
      qcpacking,
      qccello,
      packing_reject,
      pof_kue,
      sapuanpack,
      buble,
      suppliercello,
      speed_mesin,
      sample_ctn_qc,
      banded_under,
      banded_over,
      cutoff_jam,
      ctn_luar,
      d_b,
      plastik_pof,
      coklat_used,
      sortir,
      pof,
      users_input,
      downtime = [],
    } = req.body;

    const dateFormat = new Date(realdatetime.slice(0, 10))

    const existing = await automationDB.lhp.findFirst({
      where: {
        realdatetime: dateFormat,
        shift,
        grup,
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "Data already exists for this date and shift.",
      });
    }

    const newLhp = await automationDB.lhp.create({
      data: {
        realdatetime: dateFormat,
        grup,
        shift,
        sku,
        plan,
        real,
        ach,
        cello,
        cellocpp,
        ctn_type,
        cello_used,
        adonan_used,
        ccbcream_used,
        avgsheet,
        avgbook,
        sheet,
        book,
        cutkasar,
        bubukcutting,
        sapuancut,
        qcpacking,
        qccello,
        packing_reject,
        pof_kue,
        sapuanpack,
        buble,
        suppliercello,
        speed_mesin,
        sample_ctn_qc,
        banded_under,
        banded_over,
        cutoff_jam,
        ctn_luar,
        d_b: Number(d_b),
        plastik_pof,
        coklat_used,
        sortir,
        pof,
        users_input,
      },
    });

    const idLhp = newLhp.id;
    const todayDate = realdatetime.split("T")[0];

    const kendalaJson = {};
    downtime.forEach((dt, i) => {
      kendalaJson[`kendala${i + 1}`] = {
        time_start: parseTimeToISO(todayDate, dt.time_start),
        time_stop: parseTimeToISO(todayDate, dt.time_stop),
        total_dt: dt.total_dt && dt.total_dt.toString().trim() !== "" 
                  ? String(dt.total_dt) 
                  : "0",
        kendala: dt.kendala,
        unit_mesin: dt.unit_mesin,
        part_mesin: dt.part_mesin,
      };
    });

    // Update kendala JSONB
    await automationDB.lhp.update({
      where: { id: idLhp },
      data: { kendala: kendalaJson },
    });

    const validDowntime = downtime.filter(
      (dt) =>
        (dt.time_start && dt.time_start.toString().trim() !== "") ||
        (dt.time_stop && dt.time_stop.toString().trim() !== "") ||
        (dt.total_dt && dt.total_dt.toString().trim() !== "") ||
        (dt.kendala && dt.kendala.toString().trim() !== "")
    );

    if (validDowntime.length > 0) {
      await automationDB.downtime.createMany({
        data: validDowntime.map((dt) => ({
          id_lhp: idLhp,
          time_start: parseTimeToISO(todayDate, dt.time_start),
          time_stop: parseTimeToISO(todayDate, dt.time_stop),
          total_dt: dt.total_dt && dt.total_dt.toString().trim() !== "" 
                    ? String(dt.total_dt) 
                    : "0",
          kategori_downtime: dt.kategori_downtime,
          unit_mesin: dt.unit_mesin,
          part_mesin: dt.part_mesin,
          kendala: dt.kendala,
          speed_oven_plan: dt.speed_oven_plan,
          speed_oven_reduce: dt.speed_oven_reduce,
          total_sbl: dt.total_sbl,
          perbaikan: dt.perbaikan,
          penyebab: dt.penyebab,
        })),
      });
    }

    return res.status(201).json({ id: idLhp });
  } catch (error) {
    console.error("Error inserting L7 data:", error);
    return res.status(500).json({
      error: "An error occurred while saving L7 data.",
    });
  }
};