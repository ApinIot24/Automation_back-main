
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
        const dateformat = realdatetime.slice(0, 10);
        const existingEntry = await req.db.query(
            `SELECT * FROM automation.lhp_l5 WHERE realdatetime = $1 AND shift = $2  AND grup = $3`,
            [dateformat, shift, grup]
        );
        console.log("Hasil query existingEntry:", existingEntry.rows);
        console.log(dateformat);
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
    const { date, line } = req.params;

    try {
        // Parse the date parameter to ensure it's in a valid format (YYYY-MM-DD)
        const formattedDate = new Date(date);
        if (isNaN(formattedDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD.' });
        }
        // Format date to YYYY-MM-DD for SQL query
        const formattedDateString = formattedDate.toISOString().split('T')[0];

        // Query SQL untuk mendapatkan data yang diinginkan
        const query = `
WITH shifts AS (
    SELECT 'Shift 1' AS shift
    UNION ALL
    SELECT 'Shift 2'
    UNION ALL
    SELECT 'Shift 3'
),
dates AS (
    SELECT DISTINCT realdatetime
    FROM automation.lhp_l5
    WHERE realdatetime::date = $1  -- Filter by date
),
all_combinations AS (
    SELECT d.realdatetime, s.shift
    FROM dates d
    CROSS JOIN shifts s
)
SELECT
    ROW_NUMBER() OVER (ORDER BY ac.realdatetime, ac.shift) AS id,  -- Add unique ID
    ac.realdatetime,
    ac.shift,
    COALESCE(sd.users_input, '0') AS users_input, 
    COALESCE(sd.grup, 'l5') AS grup, 
    COALESCE(sd.sku, 'NONE') AS sku, 
    COALESCE(sd.reguler, '0') AS reguler, 
    COALESCE(sd.hold, '0') AS hold, 
    COALESCE(sd.output, '0') AS output, 
    COALESCE(sd.bubuk, '0') AS bubuk, 
    COALESCE(sd.berat_kering, '0') AS berat_kering, 
    COALESCE(sd.berat_basah, '0') AS berat_basah, 
    COALESCE(sd.rmd, '0') AS rmd, 
    COALESCE(sd.rfeeding, '0') AS rfeeding, 
    COALESCE(sd.rmall, '0') AS rmall, 
    COALESCE(sd.rpacktable, '0') AS rpacktable, 
    COALESCE(sd.rejectpacking, '0') AS rejectpacking, 
    COALESCE(sd.rejectstacking, '0') AS rejectstacking, 
    COALESCE(sd.rejectcoolingconveyor, '0') AS rejectcoolingconveyor, 
    COALESCE(sd.rmtotal, '0') AS rmtotal, 
    COALESCE(sd.roven, '0') AS roven, 
    COALESCE(sd.soven, '0') AS soven, 
    COALESCE(sd.mcbks, '0') AS mcbks, 
    COALESCE(sd.ptable, '0') AS ptable, 
    COALESCE(sd.serbuk, '0') AS serbuk, 
    COALESCE(sd.tampungan, '0') AS tampungan,
    COALESCE(sd.total, '0') AS total, 
    COALESCE(sd.brtpack, '0') AS brtpack, 
    COALESCE(sd.brtpcs, '0') AS brtpcs, 
    COALESCE(sd.wiinner, '0') AS wiinner, 
    COALESCE(sd.wipkulitawal, '0') AS wipkulitawal, 
    COALESCE(sd.wipkulitakhir, '0') AS wipkulitakhir, 
    COALESCE(sd.wipselisih, '0') AS wipselisih, 
    COALESCE(sd.wipkulit, '0') AS wipkulit, 
    COALESCE(sd.viawal, '0') AS viawal, 
    COALESCE(sd.viambil, '0') AS viambil, 
    COALESCE(sd.viakhir, '0') AS viakhir,
    COALESCE(sd.vireturn, '0') AS vireturn, 
    COALESCE(sd.viinner, '0') AS viinner, 
    COALESCE(sd.virainner, '0') AS virainner, 
    COALESCE(sd.viall, '0') AS viall, 
    COALESCE(sd.variance, '0') AS variance, 
    COALESCE(sd.krkawal, '0') AS krkawal, 
    COALESCE(sd.krawal, '0') AS krawal, 
    COALESCE(sd.krakhir, '0') AS krakhir, 
    COALESCE(sd.krpakai, '0') AS krpakai, 
    COALESCE(sd.kreturn, '0') AS kreturn,
    COALESCE(sd.kreject, '0') AS kreject, 
    COALESCE(sd.kendalaall, '0') AS kendalaall, 
    COALESCE(sd.rpackinner, '0') AS rpackinner, 
    COALESCE(sd.roll, '0') AS roll, 
    COALESCE(sd.sampahpacking, '0') AS sampahpacking, 
    COALESCE(sd.planning, '0') AS planning, 
    COALESCE(sd.output_kg, '0') AS output_kg, 
    COALESCE(sd.batch_buat, '0') AS batch_buat, 
    COALESCE(sd.variance_batch, '0') AS variance_batch, 
    COALESCE(sd.variance_fg, '0') AS variance_fg,
    COALESCE(sd.batch_tuang, '0') AS batch_tuang, 
    COALESCE(sd.batch_cetak, '0') AS batch_cetak, 
    COALESCE(sd.wip_adonan_awal, '0') AS wip_adonan_awal, 
    COALESCE(sd.wip_adonan_akhir, '0') AS wip_adonan_akhir, 
    COALESCE(sd.wip_adonan_selisih, '0') AS wip_adonan_selisih, 
    COALESCE(sd.wip_adonan_kulit, '0') AS wip_adonan_kulit, 
    COALESCE(sd.adonan_gagal_kg, '0') AS adonan_gagal_kg,
    COALESCE(sd.adonan_gagal_kulit, '0') AS adonan_gagal_kulit, 
    COALESCE(sd.weight_bsc_pcs, '0') AS weight_bsc_pcs, 
    COALESCE(sd.weight_bsc_pack, '0') AS weight_bsc_pack
FROM all_combinations ac
LEFT JOIN automation.lhp_l5 sd 
    ON ac.realdatetime = sd.realdatetime AND ac.shift = sd.shift
WHERE (sd.grup = $2 OR sd.grup IS NULL)  -- Filter by group, allow null for missing data
ORDER BY ac.realdatetime, ac.shift;
        `;

        // Menjalankan query
        const result = await req.db.query(query, [formattedDateString, line]);

        // Menangani hasil query dan mengirimkan response
        const datalast = result.rows;  // Hasil query dari PostgreSQL

        res.json(datalast);  // Kirimkan data sebagai JSON ke client
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).send('Error fetching data');
    }
});





export default app;