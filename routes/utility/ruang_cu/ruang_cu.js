import { Router } from "express";
import db from "../../../config/users.js";
import moment from "moment";

const app = Router();

app.get(
  "/ruang_cu/:start_date/:start_hour/:end_date/:end_hour",
  async (req, res) => {
    const { start_date, start_hour, end_date, end_hour } = req.params;

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
        "SELECT * FROM purwosari.data_utility_cu WHERE created_at BETWEEN $1 AND $2",
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
