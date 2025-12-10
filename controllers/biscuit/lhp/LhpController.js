import { automationDB } from "../../../src/db/automation.js";
function format(date) {
  if (!(date instanceof Date)) {
    throw new Error('Invalid "date" argument. You must pass a date instance');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const createLhpL5 = async (req, res) => {
  // beda dengan sql raw dari routes, disini ga dipakai untuk kendala all soalnya itu cuman redundant (pengingat)
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
      batch_buat,
      variance_batch,
      variance_fg,
      bubuk,
      beratKering,
      beratBasah,
      rmd,
      rfeeding,
      sampahpacking,
      rpackinner,
      rmall,
      roll,
      rpackTable,
      rejectpacking,
      rejectstacking,
      rejectcoolingconveyor,
      rmtotal,
      roven,
      soven,
      mcbks,
      ptable,
      serbuk,
      tampungan,
      total,
      brtpack,
      brtpcs,
      wiinner,
      wipkulitawal,
      wipkulitakhir,
      wipselisih,
      wipkulit,
      viawal,
      viambil,
      viakhir,
      vireturn,
      viinner,
      viRainner,
      viall,
      variance,
      krkawal,
      krAwal,
      krakhir,
      krpakai,
      kreturn,
      kreject,
      kendalaall,
      downtime,
      batch_tuang,
      batch_cetak,
      wip_adonan_awal,
      wip_adonan_akhir,
      wip_adonan_selisih,
      wip_adonan_kulit,
      adonan_gagal_kg,
      adonan_gagal_kulit,
      weight_bsc_pcs,
      weight_bsc_pack,
    } = req.body;

  try {
    if (!users_input || !realdatetime || !grup || !shift || !sku) {
        return res.status(400).json({ message: "Missing required fields" })
    }
    const dateFormat = new Date(realdatetime.slice(0, 10))
    const existing = await automationDB.lhp_l5.findFirst({
      where: {
        realdatetime: dateFormat,
        shift,
        grup
      }
    });
    if (existing) {
      return res.status(400).json({
        message: `Data already exists for ${realdatetime} shift ${shift} grup ${grup}`
      });
    }
    const kendalaJson = {};
    downtime?.forEach((item, index) => {
      kendalaJson[`kendala${index + 1}`] =
        `Time Start: ${item.time_start}, ` +
        `Time Stop: ${item.time_stop}, ` +
        `Total DT: ${item.total_dt}, ` +
        `Kendala: ${item.kendala}, ` +
        `Unit Mesin: ${item.unit_mesin}, ` +
        `Part Mesin: ${item.part_mesin}`;
    });

    const newLhp = await automationDB.lhp_l5.create({
      data: {
        users_input,
        realdatetime: dateFormat,
        grup,
        shift,
        sku,
        reguler,
        planning,
        hold,
        output,
        output_kg,
        batch_buat,
        variance_batch,
        variance_fg,
        bubuk,
        berat_kering: beratKering,
        berat_basah: beratBasah,
        rmd,                                       
        rfeeding,
        sampahpacking,
        rpackinner,
        rmall,
        roll,
        rpacktable : rpackTable,
        rejectpacking,
        rejectstacking,
        rejectcoolingconveyor,
        rmtotal,
        roven,
        soven,
        mcbks,
        ptable,
        serbuk,
        tampungan,
        total,
        brtpack,
        brtpcs,
        wiinner,
        wipkulitawal,
        wipkulitakhir,
        wipselisih,
        wipkulit,
        viawal,
        viambil,
        viakhir,
        vireturn,
        viinner,
        virainner: viRainner,
        viall,
        variance,
        krkawal,
        krawal: krAwal,
        krakhir,
        krpakai,
        kreturn,
        kreject,
        batch_tuang,
        batch_cetak,
        wip_adonan_awal,
        wip_adonan_akhir,
        wip_adonan_selisih,
        wip_adonan_kulit,
        adonan_gagal_kg,
        adonan_gagal_kulit,
        weight_bsc_pcs,
        weight_bsc_pack,
        kendalaall: kendalaJson
      }
    })

    if (downtime && downtime.length > 0) {
      await automationDB.$transaction(
        downtime.map((d) => 
          automationDB.downtime_l5.create({
            data: {
              id_lhp: newLhp.id,
              time_start: d.time_start,
              time_stop: d.time_stop,
              total_dt: d.total_dt,
              kendala: d.kendala,
              unit_mesin: d.unit_mesin,
              part_mesin: d.part_mesin,
              perbaikan: d.perbaikan,
              penyebab: d.penyebab
            }
          })
        )
      )
    }

    return res.status(201).json({ id: newLhp.id })
  } catch (e) {
    console.error("Error creating LHP L5:", e);
    res.status(500).json({ message: "Internal server error", error: e.message });
  }
}

export const getLatestLhpL5 = async (req, res) => {
  try {
    const latest = await automationDB.lhp_l5.findMany({
      orderBy: { id: "desc" },
      take: 1
    });

    return res.json(latest ? [latest] : []);
  } catch (e) {
    console.error("Error getLatestLhpL5:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const getLhpL5Detail = async (req, res) => {
  try {
    const id = req.params.id
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const data = await automationDB.lhp_l5.findUnique({
      where: { id }
    });

    return res.json(data ? [data] : []);
  } catch (e) {
    console.error("Error getLhpL5Detail:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const getLhpL5Daily = async (req, res) => {
  try {
    const line = req.params.line;

    const today = format(new Date());
    const todayDate = new Date(today);

    const data = await automationDB.lhp_l5.findMany({
      where: {
        realdatetime: todayDate,
        grup: line,
        shift: "Shift 1",
      },
      orderBy: { id: "asc" }
    });

    return res.json(data);
  } catch (e) {
    console.error("Error getLhpL5Daily:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getLhpL5DailyByDate = async (req, res) => {
  try {
    const { date, line } = req.params;

    // ===================== VALIDASI TANGGAL =====================
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
    }

    const dateOnly = new Date(date);
    if (isNaN(dateOnly.getTime())) {
      return res.status(400).json({ error: "Invalid date." });
    }

    const dateString = dateOnly.toISOString().split("T")[0];
    // ===================== SHIFT MASTER ==========================
    const shifts = ["Shift 1", "Shift 2", "Shift 3"];

    // ===================== COLUMN LIST ============================
    const columns = [
      "users_input", "grup", "sku", "reguler", "hold", "output", "bubuk",
      "berat_kering", "berat_basah", "rmd", "rfeeding", "rmall",
      "rpacktable", "rejectpacking", "rejectstacking", "rejectcoolingconveyor",
      "rmtotal", "roven", "soven", "mcbks", "ptable", "serbuk", "tampungan",
      "total", "brtpack", "brtpcs", "wiinner", "wipkulitawal", "wipkulitakhir",
      "wipselisih", "wipkulit", "viawal", "viambil", "viakhir", "vireturn",
      "viinner", "virainner", "viall", "variance", "krkawal", "krawal",
      "krakhir", "krpakai", "kreturn", "kreject", "kendalaall",
      "rpackinner", "roll", "sampahpacking", "planning", "output_kg",
      "batch_buat", "variance_batch", "variance_fg", "batch_tuang",
      "batch_cetak", "wip_adonan_awal", "wip_adonan_akhir",
      "wip_adonan_selisih", "wip_adonan_kulit", "adonan_gagal_kg",
      "adonan_gagal_kulit", "weight_bsc_pcs", "weight_bsc_pack"
    ];

    // ===================== FETCH DATA SEHARI =======================
    const dataRows = await automationDB.lhp_l5.findMany({
      where: {
        realdatetime: new Date(dateString),
        OR: [{ grup: line }, { grup: null }]
      }
    });

    // ===================== GENERATE SHIFT COMBINATION ==============
    const combinations = shifts.map((shiftname) => ({
      realdatetime: dateString,
      shift: shiftname
    }));

    // ===================== LEFT JOIN MANUAL ========================
    const finalOutput = combinations.map((combo, index) => {
      const found = dataRows.find((row) => row.shift === combo.shift);

      if (found) {
        return {
          ...found,
          realdatetime: dateString
        };
      }

      // COALESCE CASE: ROW TIDAK ADA
      const emptyRow = {
        id: index + 1,              // ROW_NUMBER() equivalent
        realdatetime: dateString,
        shift: combo.shift
      };

      columns.forEach((c) => {
        emptyRow[c] = "0";         // COALESCE(sd.col, '0')
      });

      return emptyRow;
    });

    // ===================== RETURN DATA =======================
    return res.json(finalOutput);

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      error: "Failed to fetch LHP L5 daily data."
    });
  }
};