import { Router } from "express";
const app = Router();
function format(date) {
  if (!(date instanceof Date)) {
    throw new Error('Invalid "date" argument. You must pass a date instance');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

app.post("/lhp", async (req, res) => {
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
    downtime,
  } = req.body;

  try {
    const existingEntry = await req.db.query(
      `SELECT * FROM automation.lhp WHERE realdatetime = $1 AND shift = $2 AND grup = $3`,
      [realdatetime, shift, grup]
    );
    // console.log("Hasil query existingEntry:", existingEntry.rows);
    // Memeriksa apakah ada data yang sudah ada
    if (existingEntry.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Data already exists for this date and shift." });
    }
    // Step 1: Insert data LHP ke dalam database
    const result = await req.db.query(
      `INSERT INTO automation.lhp (
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
                sbl_rs
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $22, $23, $24, $25,
                $26, $27, $28, $29, $30, $31, $32, $33,
                $34, $35, $36, $37, $38, $39, $40, $41,
                $42, $43, $44, $45, $46, $47, $48, $49,
                $50, $51, $52, $53, $54, $55, $56, $57,
                $58, $59                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                ) RETURNING id`,
      [
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
      ]
    );

    const idLhp = result.rows[0].id;
    // Step 2: Prepare kendala as JSONB from downtime
    const kendalaDowntime = {};
    downtime.forEach((entry, index) => {
      kendalaDowntime[
        `kendala${index + 1}`
      ] = `Time Start: ${entry.time_start}, Time Stop: ${entry.time_stop}, Total DT: ${entry.total_dt}, Kendala: ${entry.kendala}, Unit Mesin: ${entry.unit_mesin} , Part Mesin: ${entry.part_mesin}`;
    });

    // Step 3: Update kendala di tabel LHP dengan JSONB
    await req.db.query(
      `UPDATE automation.lhp
                 SET kendala = $1
                 WHERE id = $2`,
      [JSON.stringify(kendalaDowntime), idLhp] // Konversi ke JSON string sebelum menyimpan
    );

    // Step 4: Insert data downtime ke dalam tabel downtime, kaitkan dengan id_lhp
    const downtimeInsertPromises = downtime.map((entry) => {
      return req.db.query(
        `INSERT INTO automation.downtime (
                    id_lhp,
                    time_start,
                    time_stop,
                    total_dt,
                    kategori_downtime,
                    unit_mesin,
                    part_mesin,
                    kendala,
                    speed_oven_plan,
                    speed_oven_reduce,
                    total_sbl,
                    perbaikan,
                    penyebab
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          idLhp, // ID LHP yang terhubung dengan downtime
          entry.time_start,
          entry.time_stop,
          entry.total_dt,
          entry.kategori_downtime,
          entry.unit_mesin,
          entry.part_mesin,
          entry.kendala,
          entry.speed_oven_plan,
          entry.speed_oven_reduce,
          entry.total_sbl,
          entry.perbaikan,
          entry.penyebab,
        ]
      );
    });

    // Tunggu semua downtime di-insert
    await Promise.all(downtimeInsertPromises);

    res.status(201).json({ id: idLhp });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "An error occurred while saving data." });
  }
});
app.get("/lhp", async (req, res) => {
  const result = await req.db.query(
    "SELECT * FROM automation.lhp ORDER BY id DESC LIMIT 1"
  );
  // console.log("DATA", result)
  var datalast = result.rows;
  res.send(datalast);
});
app.get("/lhp/detail/:id", async (req, res) => {
  var id = req.params.id;
  const result = await req.db.query(
    `SELECT * FROM automation.lhp where id = '${id}'`
  );
  // console.log("DATA", result)
  var datalast = result.rows;
  res.send(datalast);
});
app.get("/lhp_daily/:line", async (req, res) => {
  var line = req.params.line;
  var thisdaytime = format(new Date());
  const result = await req.db
    .query(`SELECT * FROM automation.lhp where realdatetime = '${thisdaytime}' AND grup = '${line}' 
    AND shift in ('1') ORDER BY id ASC`);
  //console.log("DATA" ,result)
  var datalast = result.rows;
  res.send(datalast);
});

app.get("/lhp_daily/date/:date/:line", async (req, res) => {
  try {
    // Ambil parameter dari URL
    const { date, line } = req.params;

    // Validasi parameter tanggal
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD." });
    }
    const formattedDate = new Date(date);
    if (isNaN(formattedDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date. Please provide a valid date." });
    }
    const formattedDateString = formattedDate.toISOString().split("T")[0];

    // Validasi parameter line
    if (typeof line !== "string" || line.trim() === "") {
      return res.status(400).json({
        error: "Invalid line parameter. It must be a non-empty string.",
      });
    }

    // Query SQL
    const query = `
        WITH shifts AS (SELECT '1' AS shift UNION ALL SELECT '2' UNION ALL SELECT '3'),
             dates AS (SELECT DISTINCT realdatetime::date FROM automation.lhp WHERE realdatetime::date = $1),
             all_combinations AS (SELECT d.realdatetime, s.shift FROM dates d CROSS JOIN shifts s)
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
              .join(",\n            ")}
        FROM all_combinations ac
        LEFT JOIN automation.lhp sd ON ac.realdatetime = sd.realdatetime AND ac.shift = sd.shift
        WHERE (sd.grup = $2 OR sd.grup IS NULL)
        ORDER BY ac.realdatetime, ac.shift;
        `;

    console.log("Executing query:", query);
    console.log("With parameters:", [formattedDateString, line]);

    // Eksekusi query
    const { rows: datalast } = await req.db.query(query, [
      formattedDateString,
      line,
    ]);

    // Kirim hasilnya ke client
    res.json(datalast);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// app.get('/lhp_daily/date/:date/:line', async (req, res) => {
//     const { date, line } = req.params;

//     try {
//         // Parse the date parameter to ensure it's in a valid format (YYYY-MM-DD)
//         const formattedDate = new Date(date);
//         if (isNaN(formattedDate.getTime())) {
//             return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD.' });
//         }

//         // Format date to YYYY-MM-DD for SQL query
//         const formattedDateString = formattedDate.toISOString().split('T')[0];

//         // Query SQL to get column names and their data types from the 'lhp' table
//         const columnsQuery = `
//             SELECT column_name, data_type
//             FROM information_schema.columns
//             WHERE table_name = 'lhp' AND table_schema = 'automation';
//         `;
//         // Fetch columns data
//         const columnResult = await req.db.query(columnsQuery);
//         const columns = columnResult.rows;

//         // Build COALESCE for each column dynamically
//         const coalesceColumns = columns.map(col => {
//             if (col.data_type === 'jsonb') {
//                 // For jsonb columns, use '{}' as default for NULL
//                 return `COALESCE(sd.${col.column_name}, '{}') AS ${col.column_name}`;
//             } else if (col.column_name === 'realdatetime') {
//                 // For 'realdatetime', do not use COALESCE
//                 return `COALESCE(sd.${col.column_name}, '${formattedDateString}') AS ${col.column_name}`;
//             } else if (col.column_name === 'created_at') {
//                 // For 'created_at', set default to the formattedDateString
//                 return `COALESCE(sd.${col.column_name}, '${formattedDateString}') AS ${col.column_name}`;
//             } else {
//                 // For other columns, replace NULL with '0'
//                 return `COALESCE(sd.${col.column_name}, '0') AS ${col.column_name}`;
//             }
//         }).join(', ');
//         // Query to get all combinations of date and shift, including dynamic column handling
//         const query = `
//             WITH shifts AS (
//                 SELECT 'Shift 1' AS shift
//                 UNION ALL
//                 SELECT 'Shift 2'
//                 UNION ALL
//                 SELECT 'Shift 3'
//             ),
//             dates AS (
//                 SELECT DISTINCT realdatetime
//                 FROM automation.lhp
//                 WHERE realdatetime::date = $1
//             ),
//             all_combinations AS (
//                 SELECT d.realdatetime, s.shift
//                 FROM dates d
//                 CROSS JOIN shifts s
//             )
//             SELECT
//                 ROW_NUMBER() OVER (ORDER BY ac.realdatetime, ac.shift) AS id,
//                 ac.realdatetime,
//                 ac.shift,
//                 ${coalesceColumns}
//             FROM all_combinations ac
//     LEFT JOIN automation.lhp sd
//     ON ac.realdatetime = sd.realdatetime AND ac.shift = sd.shift
//     WHERE (sd.grup = $2 OR sd.grup IS NULL)  -- Filter by group, allow null for missing data
//     ORDER BY ac.realdatetime, ac.shift;
//         `;

//         // Run the query
//         const result = await req.db.query(query, [formattedDateString, line]);

//         // Handle query result and send response
//         const datalast = result.rows;  // Result from the query

//         res.json(datalast);  // Send data as JSON to the client
//     } catch (err) {
//         console.error('Error executing query', err.stack);
//         res.status(500).send('Error fetching data');
//     }
// });

app.post("/lhpl7", async (req, res) => {
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
    downtime, // Menambahkan downtime ke dalam request body
  } = req.body;

  try {
    const existingEntry = await req.db.query(
      `SELECT * FROM automation.lhp WHERE realdatetime = $1 AND shift = $2 AND grup = $3`,
      [realdatetime, shift, grup]
    );
    // console.log("Hasil query existingEntry:", existingEntry.rows);
    // Memeriksa apakah ada data yang sudah ada
    if (existingEntry.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Data already exists for this date and shift." });
    }
    // Step 1: Insert data LHP ke dalam database
    const result = await req.db.query(
      `INSERT INTO automation.lhp (
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
                users_input
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $22, $23, $24, $25,
                $26, $27, $28, $29, $30, $31, $32, $33,
                $34, $35, $36, $37, $38, $39
            ) RETURNING id`,
      [
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
      ]
    );
    const idLhp = result.rows[0].id;

    // Step 2: Prepare kendala as JSONB from downtime
    const kendalaDowntime = {};
    downtime.forEach((entry, index) => {
      kendalaDowntime[
        `kendala${index + 1}`
      ] = `Time Start: ${entry.time_start}, Time Stop: ${entry.time_stop}, Total DT: ${entry.total_dt}, Kendala: ${entry.kendala}, Unit Mesin: ${entry.unit_mesin} , Part Mesin: ${entry.part_mesin}`;
    });

    // Step 3: Update kendala di tabel LHP dengan JSONB
    await req.db.query(
      `UPDATE automation.lhp
                 SET kendala = $1
                 WHERE id = $2`,
      [JSON.stringify(kendalaDowntime), idLhp]
      // Konversi ke JSON string sebelum menyimpan
    );

    // Step 4: Insert data downtime ke dalam tabel downtime, kaitkan dengan id_lhp
    const downtimeInsertPromises = downtime.map((entry) => {
      return req.db.query(
        `INSERT INTO automation.downtime (
                    id_lhp,
                    time_start,
                    time_stop,
                    total_dt,
                    kategori_downtime,
                    unit_mesin,
                    part_mesin,
                    kendala,
                    speed_oven_plan,
                    speed_oven_reduce,
                    total_sbl,
                    perbaikan,
                    penyebab
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          idLhp, // ID LHP yang terhubung dengan downtime
          entry.time_start,
          entry.time_stop,
          entry.total_dt,
          entry.kategori_downtime,
          entry.unit_mesin,
          entry.part_mesin,
          entry.kendala,
          entry.speed_oven_plan,
          entry.speed_oven_reduce,
          entry.total_sbl,
          entry.perbaikan,
          entry.penyebab,
        ]
      );
    });
    console.log(downtimeInsertPromises);
    // Tunggu semua downtime di-insert
    await Promise.all(downtimeInsertPromises);

    res.status(201).json({ id: idLhp });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "An error occurred while saving data." });
  }
});

export default app;
