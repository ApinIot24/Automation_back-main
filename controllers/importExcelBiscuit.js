import xlsx from "xlsx";
import db from "../config/util.js";
import fs from "fs";

// Fungsi untuk membaca file Excel dan memasukkan data ke PostgreSQL
export default async function importExcelBiscuit(filePath, specifiedGrup = null) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    console.log(
      "Memulai proses impor data dari sheet yang sesuai ke PostgreSQL..."
    );

    console.log("sheet names", sheetNames);
    console.log("work book", workbook);

    const machineNumbers = new Map();

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      console.log(`Memproses sheet: ${sheetName}...`);

      for (let i = 13; i < data.length; i++) {
        const row = data[i];
        const machineName = row[0];

        if (!machineNumbers.has(machineName)) {
          machineNumbers.set(machineName, machineNumbers.size + 1);
        }

        const no = machineNumbers.get(machineName);

        try {
          // Menjalankan query untuk memasukkan data ke tabel pm_biscuit dengan grup yang ditentukan
          const result = await db.query(
            `INSERT INTO automation.pm_biscuit (no, machine_name, equipment, kode_barang, part_kebutuhan_alat, qty, periode_start, periode, grup) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              no,
              row[0],
              row[1],
              row[2],
              row[3],
              row[4],
              row[5],
              row[6],
              specifiedGrup,
            ]
          );
          console.log(`Inserted row ${i} successfully`);
        } catch (insertError) {
          console.error(`Error inserting row ${i}:`, insertError);
        }
      }
    }

    console.log("Proses impor data selesai.");
  } catch (error) {
    console.error("Error mengimpor data:", error);
    throw error;
  } finally {
    // Menghapus file setelah diimpor
    fs.unlinkSync(filePath);
  }
}
