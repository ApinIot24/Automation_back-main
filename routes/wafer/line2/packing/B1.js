// packingB1Routes.js
import { Router } from 'express';
const app = Router();

/**
 * Middleware untuk memastikan koneksi database ada di req.db_iot
 */
app.use((req, res, next) => {
  if (!req.db_iot) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  next();
});

/**
 * Helper: format date => YYYY-MM-DD
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
 * Mendapatkan Date object di awal "minggu ke-n" pada (year, month)
 */
function getMonthWeek(year, month, week) {
  // Set date ke tanggal 4 agar pasti berada dalam bulan
  let d = new Date(year, month - 1, 4);
  let day = d.getDay() || 7; // Minggu = 0 => 7
  d.setDate(d.getDate() - day + 1); // geser ke hari Senin
  d.setDate(d.getDate() + 7 * (week - 1)); // geser sesuai 'week'
  return d;
}

/**
 * Menghitung minggu ke-berapa dalam satu bulan
 * (Dengan offset manual, bisa diubah sesuai definisi Anda)
 */
function getWeek(date) {
  let monthStart = new Date(date);
  // setDate(0) => satu hari sebelum tgl 1
  monthStart.setDate(0);
  let offset = (monthStart.getDay() + 1) % 7 - 1;
  return Math.ceil((date.getDate() + offset) / 7);
}

/**
 * Mendapatkan array berisi 7 string tanggal untuk "minggu ke-n"
 */
function getWeekDates(year, month, week) {
  let d = getMonthWeek(year, month, week);
  let arr = [];
  for (let i = 0; i < 7; i++) {
    arr.push(d.toLocaleDateString()); // Hasil: "MM/DD/YYYY" default
    d.setDate(d.getDate() + 1);
  }
  return arr;
}

// ===================== ROUTES =====================

// 1. Shift 1
app.get('/shift1_b1', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db_iot.query(`
      SELECT counter, jam 
      FROM purwosari.packing_b1
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam IN (
          '6.46','7.0','7.30','8.0','8.30','9.0','9.30','10.0',
          '10.30','11.0','11.30','12.0','12.30','13.0','13.30',
          '14.0','14.30','14.45'
        )
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /shift1_b1:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Shift 2
app.get('/shift2_b1', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db_iot.query(`
      SELECT counter, jam 
      FROM purwosari.packing_b1
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
    console.error('Error in GET /shift2_b1:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Shift 3
app.get('/shift3_b1', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    console.log(thisdaytime);

    const thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1);
    const thisyestertime = format(thisdate);

    // Bagian jam 23.0 (hari ini)
    const resultone = await req.db_iot.query(`
      SELECT counter, jam
      FROM purwosari.packing_b1
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam = '23.0'
      ORDER BY id ASC
    `);
    const datalastone = resultone.rows;

    let cart = [];
    if (datalastone.length > 0) {
      let element = {};
      element.jam = '0.23';
      element.counter = datalastone[0].counter;
      cart.push(element);
    }

    // Bagian jam 0.30 s/d 6.59 (hari berikutnya)
    const resulttwo = await req.db_iot.query(`
      SELECT counter, jam
      FROM purwosari.packing_b1
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
    console.error('Error in GET /shift3_b1:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. packing_b1 (data terakhir)
app.get('/packing_b1', async (req, res) => {
  try {
    const result = await req.db_iot.query(`
      SELECT *
      FROM purwosari.packing_b1
      ORDER BY id DESC
      LIMIT 1
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_b1:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. packing_b1_all (graph = 'Y')
app.get('/packing_b1_all', async (req, res) => {
  try {
    const result = await req.db_iot.query(`
      SELECT *
      FROM purwosari.packing_b1
      WHERE graph = 'Y'
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_b1_all:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. packing_b1_counter (7 data terakhir)
app.get('/packing_b1_counter', async (req, res) => {
  try {
    const result = await req.db_iot.query(`
      SELECT counter
      FROM purwosari.packing_b1
      ORDER BY id DESC
      LIMIT 7
    `);
    let datalast = result.rows;
    let arr = datalast.map((row) => row.counter);
    res.json(arr);
  } catch (error) {
    console.error('Error in GET /packing_b1_counter:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 7. packing_b1_hourly
app.get('/packing_b1_hourly', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db_iot.query(`
      SELECT id, counter, time, jam
      FROM purwosari.packing_b1
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam IN (
          '8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58',
          '16.0','17.0','18.0','19.0','20.0','21.0','22.0',
          '22.58','23.58'
        )
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_b1_hourly:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 8. packing_b1_hourly dengan parameter date
app.get('/packing_b1_hourly/date/:date', async (req, res) => {
  try {
    const datethis = req.params.date;
    console.log(datethis);

    const result = await req.db_iot.query(`
      SELECT id, counter, time, jam
      FROM purwosari.packing_b1
      WHERE graph = 'Y'
        AND tanggal = '${datethis}'
        AND jam IN (
          '8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58',
          '16.0','17.0','18.0','19.0','20.0','21.0','22.0',
          '22.58','23.58'
        )
      ORDER BY id ASC
    `);
    const datalast = result.rows;

    // Ambil data jam 1.0 - 6.59 di hari berikutnya
    const thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1);
    const thisyestertime = format(thisdate);

    const resulttwo = await req.db_iot.query(`
      SELECT id, counter, time, jam
      FROM purwosari.packing_b1
      WHERE graph = 'Y'
        AND tanggal = '${thisyestertime}'
        AND jam IN ('1.0','2.0','3.0','4.0','5.0','6.0','6.59')
      ORDER BY id ASC
    `);
    const datalasttwo = resulttwo.rows;

    const twoarray = datalast.concat(datalasttwo);
    res.json(twoarray);
  } catch (error) {
    console.error('Error in GET /packing_b1_hourly/date/:date:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 9. packing_b1_daily
app.get('/packing_b1_daily', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db_iot.query(`
      SELECT id, counter, jam
      FROM purwosari.packing_b1
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam IN ('14.58','22.58')
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_b1_daily:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 10. packing_b1_daily dengan parameter date
app.get('/packing_b1_daily/date/:date', async (req, res) => {
  try {
    const datethis = req.params.date;
    console.log(datethis);

    // Tanggal `datethis`
    const result = await req.db_iot.query(`
      SELECT id, counter, jam
      FROM purwosari.packing_b1
      WHERE graph = 'Y'
        AND tanggal = '${datethis}'
        AND jam IN ('14.58','22.58')
      ORDER BY id ASC
    `);
    const datalast = result.rows;

    // jam 6.59 di hari berikutnya
    const thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1);
    const thisyestertime = format(thisdate);

    const resulttwo = await req.db_iot.query(`
      SELECT id, counter, jam
      FROM purwosari.packing_b1
      WHERE graph = 'Y'
        AND tanggal = '${thisyestertime}'
        AND jam IN ('6.59')
      ORDER BY id ASC
    `);
    const datalasttwo = resulttwo.rows;

    const twoarray = datalast.concat(datalasttwo);
    res.json(twoarray);
  } catch (error) {
    console.error('Error in GET /packing_b1_daily/date/:date:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 11. packing_b1_weekly (tanpa parameter)
app.get('/packing_b1_weekly', async (req, res) => {
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const weeklofmonth = getWeek(date);

    const dates = getWeekDates(year, month, weeklofmonth);

    const startweekdate = new Date(dates[0]);
    const startdate = format(startweekdate);
    console.log('Real Star Date', startdate);

    const endweekdate = new Date(dates[6]);
    const enddate = format(endweekdate);
    console.log('Real End Date', enddate);

    const result = await req.db_iot.query(`
      SELECT id, counter, jam, realdatetime
      FROM purwosari.packing_b1
      WHERE graph = 'Y'
        AND tanggal BETWEEN '${startdate}' AND '${enddate}'
        AND jam IN ('14.58','22.58','6.59')
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_b1_weekly:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 12. packing_b1_weekly dengan parameter date (minggu ke-n)
app.get('/packing_b1_weekly/date/:date', async (req, res) => {
  try {
    const datethis = req.params.date;
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // 7 tanggal dari "minggu ke-datethis"
    const dates = getWeekDates(year, month, datethis);

    const startweekdate = new Date(dates[0]);
    const startdate = format(startweekdate);
    console.log('Real Star Date', startdate);

    const endweekdate = new Date(dates[6]);
    const enddate = format(endweekdate);
    console.log('Real End Date', enddate);

    const result = await req.db_iot.query(`
      SELECT id, counter, jam, realdatetime
      FROM purwosari.packing_b1
      WHERE graph = 'Y'
        AND tanggal BETWEEN '${startdate}' AND '${enddate}'
        AND jam IN ('14.58','22.58','6.59')
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_b1_weekly/date/:date:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default app;
