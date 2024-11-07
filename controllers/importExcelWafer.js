import xlsx from "xlsx";
import db from '../config/util.js';
import fs from 'fs';

// Fungsi untuk membaca file Excel dan memasukkan data ke PostgreSQL
export default async function importExcelWafer(filePath) {
    try {
        // Membaca file Excel dan menggunakan sheet pertama
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        console.log("Memulai proses impor data ke PostgreSQL...");

        let currentMachineName = null; // Menyimpan machine_name saat ini sebagai induk

        for (let i = 10; i < data.length; i++) {
            const row = data[i];
            // Cek apakah seluruh baris ini kosong
            const isRowEmpty = row.every(cell => cell === null || cell === undefined || cell === '');
            if (isRowEmpty) {
                console.log("Batas tabel ditemukan pada baris kosong. Menghentikan proses di sini.");
                break;
            }
            // Perbarui machine_name jika kolom ke-2 (machine_name) tidak kosong
            if (!row[2]) {
                if (row[1]) {
                    currentMachineName = row[1]; // Menyimpan sebagai machine_name (induk) baru
                }
            }
            // Menjalankan query untuk memasukkan data ke tabel pm_wafer
            const machineRes = await db.query(
                `INSERT INTO pm_wafer (no, machine_name, equipment, part_kebutuhan_alat, qty, periode, grup) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [row[0], currentMachineName, row[1], row[2], row[3], row[4], 1]
            );
        }
        console.log("Data berhasil diimpor ke PostgreSQL.");
    } catch (error) {
        console.error("Error mengimpor data:", error);
        throw error;
    } finally {
        fs.unlinkSync(filePath); // Menghapus file setelah diimpor
    }
};
