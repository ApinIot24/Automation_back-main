import { Router } from "express";
import moment from "moment";
import pool from "../../../config/users.js";
const app = Router();

function format(date) {
  if (!(date instanceof Date)) {
    throw new Error('Invalid "date" argument. You must pass a date instance');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getMonthWeek(year, month, week) {
  let d = new Date(year, month - 1, 4);
  let day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setDate(d.getDate() + 7 * (week - 1));
  return d;
}
function getWeek(date) {
  let monthStart = new Date(date);
  monthStart.setDate(0);
  let offset = ((monthStart.getDay() + 1) % 7) - 1; // -1 is for a week starting on Monday
  return Math.ceil((date.getDate() + offset) / 7);
}
// Return array of dates for specified week of month of year
function getWeekDates(year, month, week) {
  let d = getMonthWeek(year, month, week);
  for (var i = 0, arr = []; i < 7; i++) {
    arr.push(d.toLocaleDateString());
    d.setDate(d.getDate() + 1);
  }
  return arr;
}

//CK Biscuit
app.get("/ck_biscuit/loadcell/:database/:startdate/:enddate", async (req, res) => {
  const { database, startdate, enddate } = req.params;

  // Menghindari SQL Injection dengan memvalidasi input
  if (!/^[a-zA-Z0-9_]+$/.test(database)) {
    return res.status(400).send("Invalid database name.");
  }

  // Memastikan format startdate dan enddate valid (contoh format: YYYY-MM-DD)
  const startDateValid = /^\d{4}-\d{2}-\d{2}$/.test(startdate);
  const endDateValid = /^\d{4}-\d{2}-\d{2}$/.test(enddate);

  if (!startDateValid || !endDateValid) {
    return res.status(400).send("Invalid date format. Use YYYY-MM-DD.");
  }

  console.log(startdate, enddate);

  try {
    // Membuat query SQL dengan menggunakan parameter yang disanitasi
    const query = `
      SELECT weight, date
      FROM purwosari."${database}"
      WHERE date::date BETWEEN $1 AND $2
      ORDER BY date;
    `;

    // Menjalankan query dengan parameter binding startdate dan enddate
    const result = await pool.query(query, [startdate, enddate]);

    // Menyimpan data yang didapat dan mengirimkan response
    const datalast = result.rows;
    res.send(datalast);
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).send("Error executing query.");
  }
});

export default app;
