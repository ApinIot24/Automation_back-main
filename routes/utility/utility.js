import { Router } from "express";
import db from "../../config/users.js";
import moment from "moment";

const app = Router();
app.get(
  "/history/table/:utility/:kwhpm/:start_date/:end_date/",
  async (req, res) => {
    const { utility, kwhpm, start_date, end_date } = req.params;

    try {
      let results = [];

      // Loop melalui rentang tanggal
      let currentDate = moment(start_date);
      const endDate = moment(end_date);

      while (
        currentDate.isBefore(endDate) ||
        currentDate.isSame(endDate, "day")
      ) {
        const dateStr = currentDate.format("YYYY-MM-DD");

        // Ambil data shift 1 (jam 15) dikurangi dengan jam 07 pada tanggal yang sama
        const startTimestampShift1 = moment(
          `${dateStr} 15:00`,
          "YYYY-MM-DD HH:mm"
        ).toISOString();
        const startTimestampShift0 = moment(
          `${dateStr} 07:00`,
          "YYYY-MM-DD HH:mm"
        ).toISOString();

        const resultShift1 = await db.query(
          `SELECT ${kwhpm} FROM purwosari.${utility} WHERE created_at <= $1 ORDER BY created_at DESC LIMIT 1`,
          [startTimestampShift1]
        );
        const resultShift0 = await db.query(
          `SELECT ${kwhpm} FROM purwosari.${utility} WHERE created_at <= $1 ORDER BY created_at DESC LIMIT 1`,
          [startTimestampShift0]
        );

        const shift1Data = resultShift1.rows[0]
          ? resultShift1.rows[0][kwhpm]
          : 0;
        const shift0Data = resultShift0.rows[0]
          ? resultShift0.rows[0][kwhpm]
          : 0;
        const shift1MinusShift0 = shift1Data - shift0Data;

        // Ambil data shift 2 (jam 23) dikurangi dengan jam 15 pada tanggal yang sama
        const startTimestampShift2 = moment(
          `${dateStr} 23:00`,
          "YYYY-MM-DD HH:mm"
        ).toISOString();

        const resultShift2 = await db.query(
          `SELECT ${kwhpm} FROM purwosari.${utility} WHERE created_at <= $1 ORDER BY created_at DESC LIMIT 1`,
          [startTimestampShift2]
        );

        const shift2Data = resultShift2.rows[0]
          ? resultShift2.rows[0][kwhpm]
          : 0;
        const shift2MinusShift1 = shift2Data - shift1Data;

        // Ambil data shift 3 (jam 07 pada tanggal berikutnya) dikurangi dengan jam 23 pada tanggal yang sama
        const nextDateStr = currentDate
          .clone()
          .add(1, "days")
          .format("YYYY-MM-DD");
        const startTimestampShift3 = moment(
          `${nextDateStr} 07:00`,
          "YYYY-MM-DD HH:mm"
        ).toISOString();

        const resultShift3 = await db.query(
          `SELECT ${kwhpm} FROM purwosari.${utility} WHERE created_at <= $1 ORDER BY created_at DESC LIMIT 1`,
          [startTimestampShift3]
        );

        const shift3Data = resultShift3.rows[0]
          ? resultShift3.rows[0][kwhpm]
          : 0;
        const shift3MinusShift2 = shift3Data - shift2Data;

        // Menambahkan variabel per jam
        const startTimestamp08 = moment(
          `${dateStr} 08:00`,
          "YYYY-MM-DD HH:mm"
        ).toISOString();
        const result08 = await db.query(
          `SELECT ${kwhpm} FROM purwosari.${utility} WHERE created_at <= $1 ORDER BY created_at DESC LIMIT 1`,
          [startTimestamp08]
        );
        const hours08Data = result08.rows[0] ? result08.rows[0][kwhpm] : 0;

        const startTimestamp17 = moment(
          `${dateStr} 17:00`,
          "YYYY-MM-DD HH:mm"
        ).toISOString();
        const result17 = await db.query(
          `SELECT ${kwhpm} FROM purwosari.${utility} WHERE created_at <= $1 ORDER BY created_at DESC LIMIT 1`,
          [startTimestamp17]
        );
        const hours17Data = result17.rows[0] ? result17.rows[0][kwhpm] : 0;

        const startTimestamp22 = moment(
          `${dateStr} 22:00`,
          "YYYY-MM-DD HH:mm"
        ).toISOString();
        const result22 = await db.query(
          `SELECT ${kwhpm} FROM purwosari.${utility} WHERE created_at <= $1 ORDER BY created_at DESC LIMIT 1`,
          [startTimestamp22]
        );
        const hours22Data = result22.rows[0] ? result22.rows[0][kwhpm] : 0;

        const startTimestamp03 = moment(
          `${nextDateStr} 03:00`,
          "YYYY-MM-DD HH:mm"
        ).toISOString();
        const result03 = await db.query(
          `SELECT ${kwhpm} FROM purwosari.${utility} WHERE created_at <= $1 ORDER BY created_at DESC LIMIT 1`,
          [startTimestamp03]
        );
        const hours03Data = result03.rows[0] ? result03.rows[0][kwhpm] : 0;

        // Menyimpan data hasil perhitungan per tanggal
        results.push({
          date: dateStr,
          shift1: shift1Data,
          shift0: shift0Data,
          shift2: shift2Data,
          shift3: shift3Data,
          shift1MinusShift0: shift1MinusShift0,
          shift2MinusShift1: shift2MinusShift1,
          shift3MinusShift2: shift3MinusShift2,
          hours_08: hours08Data,
          hours_17: hours17Data,
          hours_22: hours22Data,
          hours_03: hours03Data,
        });

        // Lanjutkan ke tanggal berikutnya
        currentDate = currentDate.add(1, "days");
      }

      // Kirimkan data untuk seluruh rentang tanggal
      res.json(results);
    } catch (error) {
      console.error("Error fetching data:", error);
      res
        .status(500)
        .json({ message: "Error fetching data", error: error.message });
    }
  }
);
app.get(
  "/history/table/hours/:utility/:kwhpm/:start_date/:end_date/",
  async (req, res) => {
    const { utility, kwhpm, start_date, end_date } = req.params;

    // Mengubah start_date dan end_date ke format waktu yang sesuai (00:00:00 dan 23:59:59)
    const startTimestamp = moment(
      `${start_date} 00:00:00`,
      "YYYY-MM-DD HH:mm"
    ).toISOString();
    const endTimestamp = moment(
      `${end_date} 23:59:59`,
      "YYYY-MM-DD HH:mm"
    ).toISOString();
    console.log("start", startTimestamp);
    console.log("end", endTimestamp);
    try {
      // Query dengan DISTINCT ON untuk memastikan hanya ada 1 data per jam
      const result = await db.query(
        `WITH hourly_data AS (
  SELECT 
    created_at, 
    ${kwhpm} AS kwh,
    DATE_TRUNC('hour', created_at) AS hour
  FROM purwosari.${utility}
  WHERE created_at >= $1 AND created_at <= $2
)
SELECT DISTINCT ON (hour) 
  created_at, 
  kwh, 
  hour
FROM hourly_data
ORDER BY hour, created_at;
`,
        [startTimestamp, endTimestamp]
      );

      const dataLast = result.rows.map((row) => ({
        ...row,
        hour: moment(row.created_at).utcOffset(7).format("HH:mm"),
        created_at: moment(row.created_at)
          .utcOffset(7)
          .format("YYYY-MM-DD HH:mm:ss"),
      }));

      // Mengembalikan hasil dalam format JSON
      res.json(dataLast);
    } catch (error) {
      console.error("Error fetching data:", error);
      res
        .status(500)
        .json({ message: "Error fetching data", error: error.message });
    }
  }
);

app.get(
  "/history/:utility/:start_date/:start_hour/:end_date/:end_hour",
  async (req, res) => {
    const { utility, start_date, start_hour, end_date, end_hour } = req.params;

    try {
      // Format tanggal dan jam menjadi timestamp PostgreSQL
      const startTimestamp = moment(
        `${start_date} ${start_hour}:00`,
        "YYYY-MM-DD HH:mm"
      ).toISOString();
      const endTimestamp = moment(
        `${end_date} ${end_hour}:00`,
        "YYYY-MM-DD HH:mm"
      ).toISOString();

      // Query untuk rentang waktu
      const result = await db.query(
        `SELECT * FROM purwosari.${utility} WHERE created_at BETWEEN $1 AND $2`,
        [startTimestamp, endTimestamp]
      );
      // Mengonversi waktu UTC ke WIB (jika diperlukan)
      const dataLast = result.rows.map((row) => ({
        ...row,
        created_at: moment(row.created_at)
          .utcOffset(7)
          .format("YYYY-MM-DD HH:mm:ss"),
      }));

      res.json(dataLast); // menggunakan res.json untuk merespon dengan format JSON
    } catch (error) {
      console.error("Error fetching data:", error);
      res
        .status(500)
        .json({ message: "Error fetching data", error: error.message });
    }
  }
);

export default app;
