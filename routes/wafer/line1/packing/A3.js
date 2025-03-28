// packingA3Routes.js
import { Router } from 'express';

const app = Router();

/**
 * Middleware untuk memastikan koneksi database ada di req.db
 */
app.use((req, res, next) => {
  if (!req.db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  next();
});

/**
 * Helper function: format date menjadi YYYY-MM-DD
 */
function format(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error('Invalid "date" argument. You must pass a valid Date instance');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Mendapatkan Date object di awal minggu ke-n pada suatu bulan dan tahun
 */
function getMonthWeek(year, month, week) {
  // Set date ke tanggal 4
  let d = new Date(year, month - 1, 4);
  // Dapatkan day (Minggu=0, set jadi 7)
  let day = d.getDay() || 7;
  // Mundur ke hari Senin terdekat
  d.setDate(d.getDate() - day + 1);
  // Maju ke minggu ke-n
  d.setDate(d.getDate() + 7 * (week - 1));
  return d;
}

/**
 * Mendapatkan minggu ke-berapa dalam suatu bulan
 * (Perhitungan mengikuti logika offset manual)
 */
function getWeek(date) {
  let monthStart = new Date(date);
  // setDate(0) = tanggal 0 = satu hari sebelum tanggal 1
  monthStart.setDate(0);
  let offset = (monthStart.getDay() + 1) % 7 - 1;
  return Math.ceil((date.getDate() + offset) / 7);
}

/**
 * Mendapatkan array 7 tanggal (string) untuk minggu ke-n di (year, month)
 */
function getWeekDates(year, month, week) {
  let d = getMonthWeek(year, month, week);
  let arr = [];
  for (let i = 0; i < 7; i++) {
    arr.push(d.toLocaleDateString()); // Hasil: MM/DD/YYYY (bawaan toLocaleDateString)
    d.setDate(d.getDate() + 1);
  }
  return arr;
}

// ===================== ROUTES =====================

// 1. Ambil data terakhir
app.get('/packing_a3', async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT * 
      FROM automation.packing_a3
      ORDER BY id DESC 
      LIMIT 1
    `);
    console.log('DATA', result);
    const datalast = result.rows;
    res.json(datalast);
  } catch (error) {
    console.error('Error in GET /packing_a3:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Ambil semua data (graph = 'Y')
app.get('/packing_a3_all', async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT *
      FROM automation.packing_a3
      WHERE graph = 'Y'
      ORDER BY id DESC
    `);
    console.log('DATA', result);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a3_all:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Ambil 7 data counter terakhir
app.get('/packing_a3_counter', async (req, res) => {
  try {
    const result = await req.db.query(`
      SELECT counter 
      FROM automation.packing_a3
      ORDER BY id DESC
      LIMIT 7
    `);
    console.log('DATA', result);
    const datalast = result.rows;
    const arr = datalast.map((row) => row.counter);
    res.json(arr);
  } catch (error) {
    console.error('Error in GET /packing_a3_counter:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Shift 1
app.get('/shift1_a3', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db.query(`
      SELECT counter, jam 
      FROM automation.packing_a3
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam IN (
          '6.46','7.31','8.0','8.31','9.0','9.31','10.0',
          '10.31','11.0','11.31','12.0','12.31','13.0',
          '13.31','14.0','14.31','14.45'
        )
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /shift1_a3:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Shift 2
app.get('/shift2_a3', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db.query(`
      SELECT counter, jam
      FROM automation.packing_a3
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam IN (
          '14.46','15.30','16.00','16.30','17.00','17.30','18.00',
          '18.30','19.00','19.30','20.00','20.30','21.00','21.30',
          '22.00','22.30','22.45'
        )
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /shift2_a3:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Shift 3
//   - data jam 23.0 (hari ini) di table packing_b3? (Sesuai kode asli, meski namanya "b3")
//   - data jam 0.30, 1.0, 1.31, ..., 6.59 (hari berikutnya), juga dari packing_b3
app.get('/shift3_a3', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    console.log(thisdaytime);

    const thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1);
    const thisyestertime = format(thisdate);

    // Bagian jam 23.0 di hari ini (di table packing_b3)
    const resultone = await req.db.query(`
      SELECT counter, jam
      FROM automation.packing_b3
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam = '23.0'
      ORDER BY id ASC
    `);
    const datalastone = resultone.rows;

    let cart = [];
    // Modifikasi jam 23.0 => jam 0.23 (optional, sesuai kode)
    if (datalastone.length > 0) {
      const element = {
        jam: `0.${23}`,
        counter: datalastone[0].counter,
      };
      cart.push(element);
    }

    // Bagian jam 0.30 s/d 6.59 hari berikutnya (table packing_b3)
    const resulttwo = await req.db.query(`
      SELECT counter, jam
      FROM automation.packing_b3
      WHERE graph = 'Y'
        AND tanggal = '${thisyestertime}'
        AND jam IN (
          '0.30','1.0','1.31','2.0','2.31','3.0','3.31','4.0',
          '4.31','5.0','5.31','6.0','6.31','6.59'
        )
      ORDER BY id ASC
    `);
    const datalasttwo = resulttwo.rows;

    const twoarray = cart.concat(datalasttwo);
    res.json(twoarray);
  } catch (error) {
    console.error('Error in GET /shift3_a3:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 7. packing_a3_hourly
app.get('/packing_a3_hourly', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db.query(`
      SELECT id, counter, time, jam
      FROM automation.packing_a3
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam IN (
          '8.0','9.0','10.0','11.0','12.0','13.0','14.0',
          '14.58','16.0','17.0','18.0','19.0','20.0',
          '21.0','22.0','22.58','23.58'
        )
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a3_hourly:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 8. packing_a3_hourly dengan parameter tanggal
app.get('/packing_a3_hourly/date/:date', async (req, res) => {
  try {
    const datethis = req.params.date;
    console.log(datethis);

    // Data dari tanggal `datethis`
    const result = await req.db.query(`
      SELECT id, counter, time, jam
      FROM automation.packing_a3
      WHERE graph = 'Y'
        AND tanggal = '${datethis}'
        AND jam IN (
          '8.0','9.0','10.0','11.0','12.0','13.0','14.0',
          '14.58','16.0','17.0','18.0','19.0','20.0',
          '21.0','22.0','22.58','23.58'
        )
      ORDER BY id ASC
    `);
    const datalast = result.rows;

    // Data jam 1.0 - 6.59 di hari berikutnya
    const thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1);
    const thisyestertime = format(thisdate);

    const resulttwo = await req.db.query(`
      SELECT id, counter, time, jam
      FROM automation.packing_a3
      WHERE graph = 'Y'
        AND tanggal = '${thisyestertime}'
        AND jam IN ('1.0','2.0','3.0','4.0','5.0','6.0','6.59')
      ORDER BY id ASC
    `);
    const datalasttwo = resulttwo.rows;

    const twoarray = datalast.concat(datalasttwo);
    res.json(twoarray);
  } catch (error) {
    console.error('Error in GET /packing_a3_hourly/date/:date:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 9. packing_a3_daily
app.get('/packing_a3_daily', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db.query(`
      SELECT id, counter, jam
      FROM automation.packing_a3
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam IN ('14.58','22.58')
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a3_daily:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 10. packing_a3_daily dengan parameter tanggal
app.get('/packing_a3_daily/date/:date', async (req, res) => {
  try {
    const datethis = req.params.date;
    console.log(datethis);

    // Data pada tanggal `datethis`
    const result = await req.db.query(`
      SELECT id, counter, jam
      FROM automation.packing_a3
      WHERE graph = 'Y'
        AND tanggal = '${datethis}'
        AND jam IN ('14.58','22.58')
      ORDER BY id ASC
    `);
    const datalast = result.rows;

    // Data jam 6.59 di hari berikutnya
    const thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1);
    const thisyestertime = format(thisdate);

    const resulttwo = await req.db.query(`
      SELECT id, counter, jam
      FROM automation.packing_a3
      WHERE graph = 'Y'
        AND tanggal = '${thisyestertime}'
        AND jam IN ('6.59')
      ORDER BY id ASC
    `);
    const datalasttwo = resulttwo.rows;

    const twoarray = datalast.concat(datalasttwo);
    res.json(twoarray);
  } catch (error) {
    console.error('Error in GET /packing_a3_daily/date/:date:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 11. packing_a3_weekly (tanpa parameter)
app.get('/packing_a3_weekly', async (req, res) => {
  try {
    const dateNow = new Date();
    const year = dateNow.getFullYear();
    // Pastikan month tetap 2 digit
    const month = String(dateNow.getMonth() + 1).padStart(2, '0');
    const weeklofmonth = getWeek(dateNow);

    const dates = getWeekDates(year, month, weeklofmonth);
    const startweekdate = new Date(dates[0]);
    const endweekdate = new Date(dates[6]);

    const startdate = format(startweekdate);
    const enddate = format(endweekdate);

    console.log('Real Start Date', startdate);
    console.log('Real End Date', enddate);

    const result = await req.db.query(`
      SELECT id, counter, jam, realdatetime
      FROM automation.packing_a3
      WHERE graph = 'Y'
        AND tanggal BETWEEN '${startdate}' AND '${enddate}'
        AND jam IN ('14.58','22.58','6.59')
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a3_weekly:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 12. packing_a3_weekly dengan parameter date (misal "minggu ke-n")
app.get('/packing_a3_weekly/date/:date', async (req, res) => {
  try {
    const datethis = req.params.date; // misalnya angka "3" => minggu ke-3
    const dateNow = new Date();
    const year = dateNow.getFullYear();
    const month = String(dateNow.getMonth() + 1).padStart(2, '0');

    // array 7 tanggal dari minggu ke-datethis
    const dates = getWeekDates(year, month, datethis);
    const startweekdate = new Date(dates[0]);
    const endweekdate = new Date(dates[6]);
    const startdate = format(startweekdate);
    const enddate = format(endweekdate);

    console.log('Real Start Date', startdate);
    console.log('Real End Date', enddate);

    const result = await req.db.query(`
      SELECT id, counter, jam, realdatetime
      FROM automation.packing_a3
      WHERE graph = 'Y'
        AND tanggal BETWEEN '${startdate}' AND '${enddate}'
        AND jam IN ('14.58','22.58','6.59')
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a3_weekly/date/:date:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default app;
