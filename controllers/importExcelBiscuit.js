import xlsx from "xlsx";
import db from '../config/util.js';
import fs from 'fs';

// Fungsi untuk membaca file Excel dan memasukkan data ke PostgreSQL
export default async function importExcelBiscuit(filePath, specifiedGrup = null) {
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetNames = workbook.SheetNames;

        console.log("Memulai proses impor data dari semua sheet ke PostgreSQL...");
        // Definisikan array grup sesuai kebutuhan
        const grupArray = [1, 2, 6, 7];

        // Iterasi melalui setiap sheet dalam workbook
        for (let sheetIndex = 0; sheetIndex < grupArray.length; sheetIndex++) {
            // Ambil nilai `grup` dari grupArray berdasarkan sheetIndex
            const grup = grupArray[sheetIndex];
            // Jika `specifiedGrup` ada dan tidak cocok dengan `grup` saat ini, lewati iterasi ini
            if (specifiedGrup !== null && specifiedGrup != grup) {
                continue;
            }

            const sheetName = sheetNames[sheetIndex];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
            console.log(`Memproses sheet: ${sheetName} untuk grup ${grup}...`);
            let currentMachineName = null; // Menyimpan machine_name saat ini sebagai induk

            for (let i = 13; i < data.length; i++) {
                const row = data[i];
                const isRowEmpty = row.every(cell => cell === null || cell === undefined || cell === '');

                if (isRowEmpty) break; // Keluar dari loop jika menemukan baris kosong

                // Perbarui machine_name jika kolom ke-2 (machine_name) tidak kosong
                if (!row[2]) {
                    if (row[1]) {
                        currentMachineName = row[1];
                    }
                }
                try {
                    // Menjalankan query untuk memasukkan data ke tabel pm_biscuit dengan grup yang sesuai
                    await db.query(
                        `INSERT INTO automation.pm_biscuit (no, machine_name, equipment, part_kebutuhan_alat, kode_barang, qty, periode, grup) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [row[0], currentMachineName, row[1], row[2], row[3], row[4], row[5], grup]
                    );
                    console.log(`Data berhasil diimpor dari ${sheetName}`);
                } catch (insertError) {
                    console.error(`Error inserting row ${i}:`, insertError);
                }
            }
        }

    } catch (error) {
        console.error("Error mengimpor data:", error);
        throw error;
    } finally {
        // Menghapus file setelah diimpor
        fs.unlinkSync(filePath);
    }
}
