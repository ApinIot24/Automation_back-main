import { Router } from "express";
const app = Router();

app.get('/control_lhp/:grup', async (req, res) => {
    try {
        const { grup } = req.params;
        const query = `SELECT grup, custom_control_1 FROM automation.control_lhp WHERE grup = $1`;

        const result = await req.db.query(query, [grup]);

        if (result.rowCount > 0) {
            res.status(200).json(result.rows[0].custom_control_1); // Mengirimkan hanya objek custom_control_1
        } else {
            res.status(404).json({ message: 'Group not found' });
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.put('/control_lhp/:grup', async (req, res) => {
    try {
        const { grup } = req.params;
        const formData = req.body;

        // Menginisialisasi custom_control_1 jika null
        await req.db.query(`
            UPDATE automation.control_lhp
            SET custom_control_1 = '{}'::jsonb
            WHERE grup = $1 AND custom_control_1 IS NULL;
        `, [grup]);

        // Menggunakan formData langsung tanpa lapisan tambahan '{data}'
        const query = `
            UPDATE automation.control_lhp
            SET custom_control_1 = $1::jsonb
            WHERE grup = $2
            RETURNING *;
        `;

        const result = await req.db.query(query, [JSON.stringify(formData), grup]);

        if (result.rowCount > 0) {
            res.status(200).json({
                message: 'Data updated successfully',
                data: result.rows[0].custom_control_1,  // Kembalikan hanya objek yang diperbarui
            });
        } else {
            res.status(404).json({ message: 'Group not found' });
        }
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default app;