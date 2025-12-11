import { parseTimeToISO } from "../../../config/sqlRaw.js";
import { automationDB } from "../../../src/db/automation.js";

export const createLine2a = async (req, res) => {
  const body = req.body;

  try {
    const {
    users_input,
    realdatetime,
    grup,
    shift,
    sku,
    reguler,
    planning,
    hold,
    output,
    output_kg,
    renceng_output,
    renceng_output_kg,
    tray_output,
    tray_output_kg,
    bubuk,
    berat_kering,
    berat_basah,
    rmd,
    rfeeding,
    sampahpacking,
    rpackinner_tray,
    rpackinner_renceng,
    rpacktable,
    rmall,
    rejectpacking,
    rejectstacking,
    rejectcoolingconveyor,
    roll,
    rmtotal,
    roven,
    soven,
    mcbks,
    ptable,
    sampah_metal,
    sampah_c_convey,
    total,
    batch_tuang,
    batch_tuang_tray,
    batch_cetak,
    batch_cetak_tray,
    batch_buat,
    batch_buat_tray,
    rpackinner,
    brtpcs,
    brtpcs_tray,
    brtpack,
    brtpack_tray,
    weight_bsc_pcs,
    weight_bsc_pcs_tray,
    weight_bsc_pack,
    weight_bsc_pack_tray,
    adonan_gagal_kg,
    adonan_gagal_kulit,
    wip_adonan_awal,
    wip_adonan_akhir,
    wip_adonan_selisih,
    wip_adonan_kulit,
    wipkulitawal,
    wipkulitakhir,
    wipselisih,
    wipkulit,
    viall,
    variance,
    variance_batch,
    variance_fg,
    viawal,
    viambil,
    vireturn,
    viinner,
    virainner,
    viakhir,
    krkawal,
    krawal,
    krpakai,
    kreturn,
    kreject,
    krakhir,
    serbuk,
    tampungan,
    kendalaall,
    downtime,
    } = body;

    // ===== VALIDASI WAJIB =====
    if (!users_input || !realdatetime || !grup || !shift || !sku) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const dateformat = new Date(realdatetime.slice(0, 10));

    // CEK DUPLICATE
    const existing = await automationDB.lhp_malkist_2.findFirst({
      where: {
        realdatetime: dateformat,
        shift,
        grup,
      },
    });

    if (existing) {
      return res.status(400).json({
        message: `Data already exists for ${dateformat} shift ${shift}`
      });
    }
    const todayDate = realdatetime.split("T")[0];

    // ===== BUILD JSON KENDALA =====
    const kendalaJson = {};
    (downtime || []).forEach((d, idx) => {
      // kendalaJson[`kendala${idx + 1}`] =
      //   `Start: ${d.time_start}, Stop: ${d.time_stop}, Total: ${d.total_dt}, ` +
      //   `Kendala: ${d.kendala}, Unit: ${d.unit_mesin}, Part: ${d.part_mesin}`;
      kendalaJson[`kendala${idx + 1}`] ={
        time_start: parseTimeToISO(todayDate, d.time_start),
        time_stop: parseTimeToISO(todayDate, d.time_stop),
        total_d: d.total_d && d.total_d.toString().trim() !== "" 
                ? String(d.total_d) 
                : "0",
        kendala: d.kendala,
        unit_mesin: d.unit_mesin,
        part_mesin: d.part_mesin,}
    });

    // ===== CREATE LHP (ALL 80 FIELDS) =====
    const lhp = await automationDB.lhp_malkist_2.create({
      data: {
        users_input,
        realdatetime: dateformat,
        grup,
        shift,
        sku,
        reguler,
        planning,
        hold,
        output,
        output_kg,
        renceng_output,
        renceng_output_kg,
        tray_output,
        tray_output_kg,
        bubuk: String(bubuk),
        berat_basah,
        berat_kering,
        rmd,
        rejectpacking,
        rejectstacking,
        rejectcoolingconveyor,
        roll,
        rfeeding,
        rmall,
        rpacktable,
        rmtotal,
        roven,
        soven,
        mcbks,
        ptable,
        sampah_metal,
        sampah_c_convey,
        sampahpacking,
        total,
        brtpack,
        brtpcs,
        brtpcs_tray,
        brtpack_tray,
        wipkulitawal,
        wipkulitakhir,
        wipselisih,
        wipkulit,
        viawal,
        viambil,
        viakhir,
        vireturn,
        viinner,
        virainner,
        viall,
        variance,
        variance_batch,
        variance_fg,
        krkawal,
        krawal,
        krpakai,
        kreturn,
        kreject,
        krakhir,
        batch_tuang,
        batch_tuang_tray,
        batch_cetak,
        batch_cetak_tray,
        batch_buat,
        batch_buat_tray,
        wip_adonan_awal,
        wip_adonan_akhir,
        wip_adonan_selisih,
        wip_adonan_kulit,
        adonan_gagal_kg,
        adonan_gagal_kulit,
        weight_bsc_pcs,
        weight_bsc_pcs_tray,
        weight_bsc_pack,
        weight_bsc_pack_tray,
        rpackinner,
        rpackinner_tray,
        rpackinner_renceng,
        tampungan,
        serbuk,
        kendalaall: kendalaJson
      }
    });

    // ===== INSERT DOWNTIME RELATION =====
    const validDowntime = downtime.filter(
      (dt) =>
        (dt.time_start && dt.time_start.toString().trim() !== "") ||
        (dt.time_stop && dt.time_stop.toString().trim() !== "") ||
        (dt.total_dt && dt.total_dt.toString().trim() !== "") ||
        (dt.kendala && dt.kendala.toString().trim() !== "")
    );

    if (validDowntime.length > 0) {
      await automationDB.$transaction(
        validDowntime.map((d) =>
          automationDB.downtime_line2a.create({
            data: {
              id_lhp: lhp.id,
              time_start: parseTimeToISO(todayDate, d.time_start),
              time_stop: parseTimeToISO(todayDate, d.time_stop),
              total_dt: d.total_dt && d.total_dt.toString().trim() !== "" 
                    ? String(d.total_dt) 
                    : "0",
              kendala: d.kendala,
              unit_mesin: d.unit_mesin,
              part_mesin: d.part_mesin,
              perbaikan: d.perbaikan,
              penyebab: d.penyebab,
            }
          })
        )
      );
    }

    return res.status(201).json({ id: lhp.id });

  } catch (err) {
    console.error("Create L2A Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
export const getLine2aLast = async (req, res) => {
  try {
    const last = await automationDB.lhp_malkist_2.findMany({
      orderBy: { id: "desc" },
      take: 1,
    });

    return res.json(last);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getLhpById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await automationDB.lhp_malkist_2.findMany({
      where: { id: Number(id) },
    });

    if (!data) {
      return res.status(404).json({ error: "Data not found" });
    }

    return res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getLhpDailyToday = async (req, res) => {
  try {
    const { line } = req.params;

    const today = new Date();
    const formatted = today.toISOString().split("T")[0]; // YYYY-MM-DD

    const result = await automationDB.lhp_malkist_2.findMany({
      where: {
        realdatetime: formatted,
        grup: line,
        shift: "Shift 1",
      },
      orderBy: { id: "asc" }
    });

    return res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getLhpDailyByDate = async (req, res) => {
  try {
    const { date, line } = req.params;

    // ================= VALIDASI TANGGAL =================
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
    }

    const baseDate = new Date(date);
    if (isNaN(baseDate.getTime())) {
      return res.status(400).json({ error: "Invalid date." });
    }

    // ============= FETCH DATA SESUAI SQL ORIGINAL =============
    // SQL original menggunakan:
    // realdatetime::date = $1  → Prisma: realdatetime = new Date(date)
    // (grup = line OR grup IS NULL)
    const rows = await automationDB.lhp_malkist_2.findMany({
      where: {
        realdatetime: new Date(date),
        OR: [
          { grup: line },
          { grup: null }
        ]
      },
      orderBy: [{ shift: "asc" }]
    });

    // ================= SHIFT LIST (persis SQL) =================
    const shifts = ["Shift 1", "Shift 2", "Shift 3"];

    // ================= COLUMN LIST (COALESCE) ==================
    const columns = [
      "users_input",
      "grup",
      "sku",
      "reguler",
      "hold",
      "output",
      "bubuk",
      "berat_kering",
      "berat_basah",
      "rmd",
      "rfeeding",
      "rmall",
      "rpacktable",
      "rejectpacking",
      "rejectstacking",
      "rejectcoolingconveyor",
      "rmtotal",
      "roven",
      "soven",
      "mcbks",
      "ptable",
      "serbuk",
      "tampungan",
      "total",
      "brtpack",
      "brtpcs",
      "wipkulitawal",
      "wipkulitakhir",
      "wipselisih",
      "wipkulit",
      "viawal",
      "viambil",
      "viakhir",
      "vireturn",
      "viinner",
      "virainner",
      "viall",
      "variance",
      "krkawal",
      "krawal",
      "krakhir",
      "krpakai",
      "kreturn",
      "kreject",
      "kendalaall",
      "rpackinner",
      "roll",
      "sampahpacking",
      "planning",
      "output_kg",
      "batch_buat",
      "variance_batch",
      "variance_fg",
      "batch_tuang",
      "batch_cetak",
      "wip_adonan_awal",
      "wip_adonan_akhir",
      "wip_adonan_selisih",
      "wip_adonan_kulit",
      "adonan_gagal_kg",
      "adonan_gagal_kulit",
      "weight_bsc_pcs",
      "weight_bsc_pack"
    ];

    // ================= GENERATE SHIFT ROWS (CROSS JOIN) =================
    const finalOutput = shifts.map((shiftName, index) => {
      const found = rows.find((r) => r.shift === shiftName);

      if (found) return found;

      // === NO DATA → fallback row ala SQL COALESCE ===
      const emptyRow = {
        id: index + 1,  // sama seperti SQL ROW_NUMBER()
        realdatetime: date,
        shift: shiftName
      };

      columns.forEach(col => {
        emptyRow[col] = "0";
      });

      return emptyRow;
    });

    // ================= SEND RESULT =================
    return res.json(finalOutput);

  } catch (err) {
    console.error("Error in getLhpDailyByDate:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};