import { Router } from 'express';
import multer from 'multer';
import importExcelBiscuit from '../../../controllers/importExcelBiscuit.js';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

function generateWeeklyDataForTargetYear(totalWeeks, period, startPeriod, targetYear) {
    const weekData = {};
    // Inisialisasi semua minggu di tahun target dengan default "C/I"
    for (let i = 1; i <= totalWeeks; i++) {
        weekData[`w${i}`] = 'C/I';
    }
    // Validasi `period` dan `startPeriod`
    if (!period || typeof period !== 'string' || !startPeriod || typeof startPeriod !== 'string') {
        console.warn('Periode atau startPeriod tidak valid. Menggunakan default "C/I" untuk setiap minggu.');
        return weekData;
    }

    // Ambil simbol dan interval dari `period`
    const symbol = period.charAt(0) || 'C';
    const intervalMatch = period.match(/\d+/);
    const interval = intervalMatch ? parseInt(intervalMatch[0], 10) : null;
    if (!interval) {
        return weekData; // Jika interval tidak valid, kembali dengan data default
    }

    // Ekstrak tahun dan minggu awal dari `startPeriod`
    const [startYear, startWeekString] = startPeriod.split('w');
    let startWeek = parseInt(startWeekString?.trim(), 10);
    let year = parseInt(startYear, 10);

    if (isNaN(startWeek) || isNaN(year)) {
        return weekData; // Validasi jika parsing gagal
    }

    // Validasi jika tahun target lebih kecil dari startYear, maka seluruh minggu di tahun target adalah "C/I"
    if (targetYear < year) {
        return weekData; // Kembalikan data minggu dengan "C/I" karena tahun target lebih kecil dari startYear
    }
    // Hitung jumlah total minggu untuk setiap tahun hingga targetYear
    while (year < targetYear) {
        const weeksInYear = getTotalWeeksInYear(year);
        const remainingWeeks = weeksInYear - startWeek + 1; // Minggu yang tersisa di tahun ini dari startWeek
        const cycles = Math.floor(remainingWeeks / interval); // Hitung berapa kali siklus terjadi dalam tahun ini
        startWeek = ((remainingWeeks % interval) + interval) % interval || interval; // Tentukan minggu awal untuk tahun berikutnya
        year++;
    }
    // Mulai dari minggu yang benar di tahun target
    // Tentukan minggu startWeek yang valid di tahun target
    if (year === targetYear) {
        const weeksInTargetYear = getTotalWeeksInYear(targetYear);
        if (startWeek > weeksInTargetYear) {
            // Jika startWeek lebih besar dari jumlah minggu di tahun target, sesuaikan
            startWeek = weeksInTargetYear;
        }
    }
    // Isi minggu pada tahun target berdasarkan startWeek dan interval yang dihitung
    for (let i = startWeek; i <= totalWeeks; i += interval) {
        weekData[`w${i}`] = symbol;
    }

    return weekData;
}

function getTotalWeeksInYear(year) {
    const lastDay = new Date(year, 11, 31);
    const firstDayOfYear = new Date(year, 0, 1);
    const dayOfWeek = firstDayOfYear.getDay();
    const firstMonday = new Date(year, 0, 1 + (dayOfWeek <= 4 ? -dayOfWeek : 7 - dayOfWeek));
    return Math.ceil((lastDay - firstMonday) / (7 * 24 * 60 * 60 * 1000));
}


router.get('/pm_biscuit/:group/:year', async (req, res) => {
    try {
        const group = parseInt(req.params.group, 10);
        const year = parseInt(req.params.year, 10); // Tahun target (misalnya, 2024)

        const result = await req.db.query('SELECT * FROM automation.pm_biscuit WHERE grup = $1 ORDER BY machine_name ASC', [group]);
        const totalWeeks = getTotalWeeksInYear(year);

        const modifiedData = result.rows.map(row => ({
            ...row,
            week: generateWeeklyDataForTargetYear(totalWeeks, row.periode, row.periode_start, year)
        }));
        res.json(modifiedData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

router.put('/update_field/:id', async (req, res) => {
    const { id } = req.params;
    const { field, value } = req.body;

    // Daftar kolom yang diperbolehkan untuk diperbarui
    const allowedFields = ['machine_name', 'equipment', 'kode_barang', 'part_kebutuhan_alat', 'qty', 'periode', 'periode_start'];
    
    // Validasi input untuk memastikan kolom yang akan diperbarui diizinkan
    if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: 'Kolom yang diberikan tidak valid atau tidak dapat diperbarui' });
    }

    try {
        // Perbarui kolom yang sesuai pada baris dengan id yang diberikan
        const result = await req.db.query(
            `UPDATE automation.pm_biscuit SET ${field} = $1 WHERE id = $2 RETURNING *`,
            [value, id]
        );

        if (result.rowCount === 0) {
            // Jika tidak ada baris yang diperbarui, kirimkan respons 404
            return res.status(404).json({ error: 'Data tidak ditemukan' });
        }
        // Kirimkan data yang diperbarui sebagai respons
        res.json({
            message: `${field} berhasil diperbarui`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error(`Error updating ${field}:`, error);
        res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui data' });
    }
});

// Endpoint API
router.post('/import/biscuit', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;

    try {
        await importExcelBiscuit(filePath);
        res.status(200).send("Data berhasil diimpor ke PostgreSQL.");
    } catch (error) {
        res.status(500).send("Gagal mengimpor data: " + error.message);
    }
});

router.post('/import/biscuit/:grup', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    const grup = req.params.grup; // Mengambil parameter grup dari URL
    try {
        // Anda dapat meneruskan `grup` ke fungsi `importExcelBiscuit` jika diperlukan
        await importExcelBiscuit(filePath, grup);
        res.status(200).send(`Data untuk grup ${grup} berhasil diimpor ke PostgreSQL.`);
    } catch (error) {
        res.status(500).send(`Gagal mengimpor data untuk grup ${grup}: ` + error.message);
    }
});


router.delete('/deleted/biscuit/:group', async (req, res) => {
    try {
        // Menghapus data di database berdasarkan group
        const group = parseInt(req.params.group, 10);
        const result = await req.db.query('DELETE FROM automation.pm_biscuit WHERE grup = $1 RETURNING *', [group]);
        // Mengirimkan hasil sebagai JSON, yaitu data yang telah dihapus
        res.json({ message: 'Data deleted successfully', deletedData: result.rows });
    } catch (error) {
        console.error('Error deleting data:', error);
        res.status(500).json({ error: 'Error deleting data' });
    }
});

router.delete('/delete_all_biscuit', async (req, res) => {
    try {
        const result = await req.db.query('DELETE FROM automation.pm_biscuit');
        res.json({ message: 'Semua data telah berhasil dihapus.', affectedRows: result.rowCount });
    } catch (error) {
        console.error('Error deleting all data:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat menghapus semua data.' });
    }
});
export default router;
