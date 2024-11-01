


import { Router } from "express";
const app = Router();

app.get('/downtime_daily_l5/range/:startDate/:endDate/:line', async (req, res) => {
    try {
        const { startDate, endDate, line } = req.params; // Destrukturisasi params dengan benar

        // Query untuk join tabel lhp dan downtime dengan rentang tanggal
        const query = `
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
                lhp_l5.realdatetime BETWEEN $1 AND $2  -- Filter berdasarkan rentang tanggal
                AND lhp_l5.grup = $3                 -- Filter berdasarkan grup
            ORDER BY 
                downtime_l5.id ASC
        `;

        // Menggunakan parameterized query untuk menghindari SQL injection
        const result = await req.db.query(query, [startDate, endDate, line]); // Parameter dipisahkan dari query

        // Mengirimkan hasil query sebagai response
        res.send(result.rows);
    } catch (error) {
        console.error("Error fetching downtime data:", error);
        res.status(500).send('Internal Server Error');
    }
});
export default app;
