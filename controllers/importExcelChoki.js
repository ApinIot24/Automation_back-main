import xlsx from "xlsx";
import fs from "fs";
import { automationDB } from "../src/db/automation.js";

const CHUNK_SIZE = 50;

export default async function importExcelChoki(filePath, specifiedGrup = null) {
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

      console.log(`Memproses sheet: ${sheetName}`);

      const rows = [];

      for (let i = 13; i < data.length; i++) {
        const row = data[i];
        const machineName = row[0];
        if (!machineName) continue;

        if (!machineNumbers.has(machineName)) {
          machineNumbers.set(machineName, machineNumbers.size + 1);
        }

        rows.push({
          excelRow: i + 1,
          values: [
            machineNumbers.get(machineName), // no
            row[0] ?? null, // qrcode
            row[1] ?? null, // machine_name
            row[2] ?? null, // equipment
            row[3] ?? null, // kode_barang
            row[4] ?? null, // part_kebutuhan_alat
            row[5] ?? null, // qty
            row[6] ?? null, // periode_start
            row[7] ?? null, // periode
            specifiedGrup,  // grup
          ],
        });
      }

      let success = 0;
      let failed = 0;

      // ===== INSERT PER CHUNK =====
      for (let c = 0; c < rows.length; c += CHUNK_SIZE) {
        const chunk = rows.slice(c, c + CHUNK_SIZE);

        await Promise.all(
          chunk.map(async ({ excelRow, values }) => {
            try {
              await automationDB.$queryRaw`
                INSERT INTO automation.pm_choki
                (no, qrcode, machine_name, equipment, kode_barang,
                  part_kebutuhan_alat, qty, periode_start, periode, grup)
                VALUES (
                  ${values[0]}, ${values[1]}, ${values[2]}, ${values[3]},
                  ${values[4]}, ${values[5]}, ${values[6]}, ${values[7]},
                  ${values[8]}, ${values[9]}
                )
              `;
              success++;
            } catch (err) {
              failed++;
              console.error(
                `❌ Sheet: ${sheetName} | Excel Row: ${excelRow}`,
                err.message
              );
            }
          })
        );
      }

      console.log(
        `Sheet ${sheetName} selesai → Success: ${success}, Failed: ${failed}`
      );
    }

    console.log("Import PM Choki selesai.");
  } catch (err) {
    console.error("Fatal import error:", err);
    throw err;
  } finally {
    fs.unlinkSync(filePath);
  }
}
