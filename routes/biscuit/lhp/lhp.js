
import { Router } from "express";
const app = Router();

function format(date) {
    if (!(date instanceof Date)) {
        throw new Error('Invalid "date" argument. You must pass a date instance');
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

app.post('/lhpl5', async (req, res) => {
    const {
        users_input, realdatetime, grup, shift, sku, reguler, planning, hold, output, output_kg,
        batch_buat, variance_batch, variance_fg, bubuk, beratKering, beratBasah, rmd, rfeeding, sampahpacking, rpackinner,
        rmall, roll, rpackTable, rejectpacking, rejectstacking, rejectcoolingconveyor, rmtotal, roven, soven, mcbks, ptable, serbuk, tampungan,
        total, brtpack, brtpcs, wiinner, wipkulitawal, wipkulitakhir, wipselisih, wipkulit, viawal, viambil, viakhir,
        vireturn, viinner, viRainner, viall, variance, krkawal, krAwal, krakhir, krpakai, kreturn,
        kreject, kendalaall, downtime, batch_tuang, batch_cetak, wip_adonan_awal, wip_adonan_akhir, wip_adonan_selisih, wip_adonan_kulit, adonan_gagal_kg,
        adonan_gagal_kulit, weight_bsc_pcs, weight_bsc_pack,
    } = req.body;

    try {
        if (!users_input || !realdatetime || !grup || !shift || !sku) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const existingEntry = await req.db.query(
            `SELECT * FROM automation.lhp_l5 WHERE realdatetime = $1 AND shift = $2`,
            [realdatetime, shift]
        );
        const dateformat = realdatetime.slice(0, 10);
        // console.log("Hasil query existingEntry:", existingEntry.rows);
        // console.log(dateformat);
        if (existingEntry.rows.length > 0) {
            return res.status(400).json({ message: `Data already exists for this date and shift. your date ${dateformat} and your ${shift}` });
        }
        // Step 1: Insert data LHP L5 ke dalam database
        const result = await req.db.query(
            `INSERT INTO automation.lhp_l5 (
                users_input, realdatetime, grup, shift, sku, reguler, hold, output, bubuk,
                berat_kering, berat_basah, rmd, rfeeding, 
                rmall, rpacktable, rejectpacking, rejectstacking, rejectcoolingconveyor,rmtotal, roven, soven, mcbks, ptable, serbuk, tampungan, total, 
                brtpack, brtpcs, wiinner, wipkulitawal, wipkulitakhir, wipselisih,wipkulit, viawal, viambil, viakhir, vireturn,
                viinner, virainner, viall, variance, krkawal, krawal, krakhir, krpakai, kreturn, kreject,
                kendalaall, rpackinner, roll, sampahpacking, planning, output_kg, batch_buat, variance_batch, variance_fg,
                batch_tuang, batch_cetak, wip_adonan_awal, wip_adonan_akhir, wip_adonan_selisih,
                wip_adonan_kulit, adonan_gagal_kg, adonan_gagal_kulit, weight_bsc_pcs, weight_bsc_pack
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
                $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
                $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, 
                $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
                $51, $52, $53, $54, $55, $56, $57, $58, $59, $60,
                $61, $62, $63, $64, $65, $66
            ) RETURNING id`,
            [
                users_input, realdatetime, grup, shift, sku, reguler, hold, output, bubuk,
                beratKering, beratBasah, rmd, rfeeding,
                rmall, rpackTable, rejectpacking, rejectstacking, rejectcoolingconveyor, rmtotal, roven, soven, mcbks, ptable, serbuk, tampungan, total,
                brtpack, brtpcs, wiinner, wipkulitawal, wipkulitakhir, wipselisih, wipkulit, viawal, viambil, viakhir, vireturn,
                viinner, viRainner, viall, variance, krkawal, krAwal, krakhir, krpakai, kreturn, kreject,
                kendalaall, rpackinner, roll, sampahpacking, planning, output_kg, batch_buat, variance_batch,
                variance_fg,
                batch_tuang, batch_cetak, wip_adonan_awal, wip_adonan_akhir, wip_adonan_selisih,
                wip_adonan_kulit, adonan_gagal_kg, adonan_gagal_kulit, weight_bsc_pcs, weight_bsc_pack
            ]
        );

        if (result.rows.length === 0) {
            throw new Error("Failed to insert data into LHP L5");
        }

        const idLhpL5 = result.rows[0].id;

        // Step 2: Prepare kendala as JSONB from downtime
        const kendalaDowntime = {};
        downtime.forEach((entry, index) => {
            kendalaDowntime[`kendala${index + 1}`] = `Time Start: ${entry.time_start}, Time Stop: ${entry.time_stop}, Total DT: ${entry.total_dt}, Kendala: ${entry.kendala}, Unit Mesin: ${entry.unit_mesin} , Part Mesin: ${entry.part_mesin}`;
        });

        // Step 3: Update kendala di tabel LHP dengan JSONB
        await req.db.query(
            `UPDATE automation.lhp_l5
               SET kendalaall = $1
               WHERE id = $2`,
            [JSON.stringify(kendalaDowntime), idLhpL5]
            // Konversi ke JSON string sebelum menyimpan
        );

        // Step 4: Insert data downtime ke dalam tabel downtime, kaitkan dengan id_lhp
        const downtimeInsertPromises = downtime.map(entry => {
            return req.db.query(
                `INSERT INTO automation.downtime_l5 (
                  id_lhp,
                  time_start,
                  time_stop,
                  total_dt,
                  kendala,
                  unit_mesin,
                  part_mesin,
                  perbaikan,
                  penyebab
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    idLhpL5, // ID LHP yang terhubung dengan downtime
                    entry.time_start,
                    entry.time_stop,
                    entry.total_dt,
                    entry.kendala,
                    entry.unit_mesin,
                    entry.part_mesin,
                    entry.perbaikan,
                    entry.penyebab
                ]
            );
        });

        // Tunggu semua downtime di-insert
        await Promise.all(downtimeInsertPromises);

        res.status(201).json({ id: idLhpL5 });
    } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});
app.get('/lhpl5', async (req, res) => {
    const result = await req.db.query('SELECT * FROM automation.lhp_l5 ORDER BY id DESC LIMIT 1');
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhpl5/detail/:id', async (req, res) => {
    var id = req.params.id
    const result = await req.db.query(`SELECT * FROM automation.lhp_l5 where id = '${id}'`);
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhpl5_daily/:line', async (req, res) => {
    var line = req.params.line
    var thisdaytime = format(new Date());
    const result = await req.db.query(`SELECT * FROM automation.lhp_l5 where realdatetime = '${thisdaytime}' AND grup = '${line}' 
    AND shift in ('Shift 1') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhpl5_daily/date/:date/:line', async (req, res) => {
    var line = req.params.line
    var datethis = req.params.date
    // console.log(datethis)
    const result = await req.db.query(`SELECT * FROM automation.lhp_l5 where realdatetime = '${datethis}' AND grup = '${line}'
    AND shift in ('Shift 1','Shift 2','Shift 3') ORDER BY shift ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await req.db.query(`SELECT * FROM automation.lhp_l5 where realdatetime = '${thisyestertime}' AND grup = '${line}'
    // AND shift in ('Shift 3') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
export default app;