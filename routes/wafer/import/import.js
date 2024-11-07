import { Router } from 'express';
import multer from 'multer';
import importExcelWafer from '../../../controllers/importExcelWafer.js';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

function generateWeeklyData(totalWeeks) {
    const weekData = {};
    for (let i = 1; i <= totalWeeks; i++) {
        // Menambahkan data dummy untuk setiap minggu, bisa diganti dengan data dinamis sesuai kebutuhan
        weekData[`w${i}`] = i % 2 === 0 ? 'C/I' : 'L'; // Contoh pola untuk C/I dan L
    }
    return weekData;
}

function getTotalWeeksInYear(year) {
    const lastDay = new Date(year, 11, 31);
    const firstDayOfYear = new Date(year, 0, 1);
    const dayOfWeek = firstDayOfYear.getDay();
    // Adjust the first day of the year to start counting from Monday
    const firstMonday = new Date(year, 0, 1 + (dayOfWeek <= 4 ? -dayOfWeek : 7 - dayOfWeek));
    // Calculate total weeks by dividing days from the first Monday to the last day by 7
    return Math.ceil((lastDay - firstMonday) / (7 * 24 * 60 * 60 * 1000));
}


// Endpoint API
router.get('/pm_wafer_l1', async (req, res) => {
    try {
        const result = await req.db.query('SELECT * FROM automation.pm_wafer WHERE grup = $1', [1]);
        // Total minggu dalam setahun yang berakhir pada hari Minggu
        const totalWeeks = getTotalWeeksInYear(new Date().getFullYear());
        // Menambahkan struktur `week` ke setiap item dalam data
        const modifiedData = result.rows.map(row => ({
            ...row,
            week: generateWeeklyData(totalWeeks) // Menambahkan data mingguan
        }));
        res.json(modifiedData); // Mengirimkan hasil JSON
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

router.post('/import/wafer', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;

    try {
        await importExcelWafer(filePath);
        res.status(200).send("Data berhasil diimpor ke PostgreSQL.");
    } catch (error) {
        res.status(500).send("Gagal mengimpor data: " + error.message);
    }
});

export default router;
