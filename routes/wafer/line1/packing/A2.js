// packingA2Routes.js
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
  // Set date ke tanggal 4 agar aman tidak salah bulan
  let d = new Date(year, month - 1, 4);
  // Dapatkan hari (Minggu = 0, set jadi 7)
  let day = d.getDay() || 7;
  // Mundur ke hari Senin terdekat sebelum/tepat 4
  d.setDate(d.getDate() - day + 1);
  // Maju ke minggu yang diinginkan
  d.setDate(d.getDate() + 7 * (week - 1));
  return d;
}

/**
 * Mendapatkan minggu ke-berapa di dalam suatu bulan
 * (Perhitungan mengikuti logika offset manual)
 */
function getWeek(date) {
  // Mengambil tanggal 1 di bulan berjalan
  let monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  // offset = jumlah hari "kelebihan" sebelum minggu penuh
  let offset = (monthStart.getDay() + 6) % 7;
  // Rumus perkiraan minggu
  return Math.ceil((date.getDate() + offset) / 7);
}

/**
 * Return array 7 tanggal (string) untuk minggu ke-n di (year, month)
 */
function getWeekDates(year, month, week) {
  let d = getMonthWeek(year, month, week);
  let arr = [];
  for (let i = 0; i < 7; i++) {
    // gunakan format(d) agar konsisten ke YYYY-MM-DD
    arr.push(d.toLocaleDateString());
    d.setDate(d.getDate() + 1);
  }
  return arr;
}

// ===================== ROUTES =====================

// 1. Ambil data terakhir
app.get('/packing_a2', async (req, res) => {
  try {
    const result = await req.db_iot.query(
      'SELECT * FROM purwosari.packing_a2 ORDER BY id DESC LIMIT 1'
    );
    const datalast = result.rows;
    res.json(datalast);
  } catch (error) {
    console.error('Error in GET /packing_a2:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Ambil semua data (yang graph = 'Y')
app.get('/packing_a2_all', async (req, res) => {
  try {
    const result = await req.db_iot.query(`
      SELECT * FROM purwosari.packing_a2 
      WHERE graph = 'Y' 
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a2_all:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Ambil 7 data counter terakhir
app.get('/packing_a2_counter', async (req, res) => {
  try {
    const result = await req.db_iot.query(`
      SELECT counter 
      FROM purwosari.packing_a2 
      ORDER BY id DESC 
      LIMIT 7
    `);
    const datalast = result.rows;
    const arr = datalast.map((row) => row.counter);
    res.json(arr);
  } catch (error) {
    console.error('Error in GET /packing_a2_counter:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Shift 1
app.get('/shift1_a2', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db_iot.query(`
      SELECT counter, jam
      FROM purwosari.packing_a2
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam IN (
          '6.47','7.0','7.30','8.0','8.30','9.0','9.30','10.0',
          '10.30','11.0','11.30','12.0','12.30','13.0','13.30',
          '14.0','14.30','14.44'
        )
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /shift1_a2:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Shift 2
app.get('/shift2_a2', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db_iot.query(`
      SELECT counter, jam
      FROM purwosari.packing_a2
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam IN (
          '14.47','15.30','16.00','16.30','17.00','17.30','18.00',
          '18.30','19.00','19.30','20.00','20.30','21.00','21.30',
          '22.00','22.30','22.45'
        )
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /shift2_a2:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Shift 3
app.get('/shift3_a2', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1);
    const thisyestertime = format(thisdate);

    // Bagian jam 22.47 hari ini
    const resultone = await req.db_iot.query(`
      SELECT counter, jam
      FROM purwosari.packing_a2
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam = '22.47'
      ORDER BY id ASC
    `);
    const datalastone = resultone.rows;

    // Modifikasi jam 22.47 jadi 0.23 (opsional, sesuai kode asli)
    let cart = [];
    if (datalastone.length > 0) {
      let element = {};
      element.jam = '0.23';
      element.counter = datalastone[0].counter;
      cart.push(element);
    }

    // Bagian jam 0.30 - 6.45 di hari berikutnya
    const resulttwo = await req.db_iot.query(`
      SELECT counter, jam
      FROM purwosari.packing_a2
      WHERE graph = 'Y'
        AND tanggal = '${thisyestertime}'
        AND jam IN (
          '0.30','1.0','1.31','2.0','2.31','3.0','3.31','4.0',
          '4.31','5.0','5.31','6.0','6.31','6.45'
        )
      ORDER BY id ASC
    `);
    const datalasttwo = resulttwo.rows;

    const twoarray = cart.concat(datalasttwo);
    res.json(twoarray);
  } catch (error) {
    console.error('Error in GET /shift3_a2:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 7. packing_a2_hourly
app.get('/packing_a2_hourly', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db_iot.query(`
      SELECT id, counter, time, jam
      FROM purwosari.packing_a2
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
    console.error('Error in GET /packing_a2_hourly:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 8. packing_a2_hourly dengan parameter date
app.get('/packing_a2_hourly/date/:date', async (req, res) => {
  try {
    const datethis = req.params.date;
    // Data dari hari `datethis`
    const result = await req.db_iot.query(`
      SELECT id, counter, time, jam
      FROM purwosari.packing_a2
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

    // Data jam 1.0 - 6.59 di hari berikutnya
    const thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1);
    const thisyestertime = format(thisdate);

    const resulttwo = await req.db_iot.query(`
      SELECT id, counter, time, jam
      FROM purwosari.packing_a2
      WHERE graph = 'Y'
        AND tanggal = '${thisyestertime}'
        AND jam IN (
          '1.0','2.0','3.0','4.0','5.0','6.0','6.59'
        )
      ORDER BY id ASC
    `);
    const datalasttwo = resulttwo.rows;

    const twoarray = datalast.concat(datalasttwo);
    res.json(twoarray);
  } catch (error) {
    console.error('Error in GET /packing_a2_hourly/date/:date:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 9. packing_a2_daily
app.get('/packing_a2_daily', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db_iot.query(`
      SELECT id, counter, jam
      FROM purwosari.packing_a2
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam IN ('14.58','22.58')
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a2_daily:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 10. packing_a2_daily dengan parameter date
app.get('/packing_a2_daily/date/:date', async (req, res) => {
  try {
    const datethis = req.params.date;
    // Data pada tanggal yang diminta
    const result = await req.db_iot.query(`
      SELECT id, counter, jam
      FROM purwosari.packing_a2
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

    const resulttwo = await req.db_iot.query(`
      SELECT id, counter, jam
      FROM purwosari.packing_a2
      WHERE graph = 'Y'
        AND tanggal = '${thisyestertime}'
        AND jam IN ('6.59')
      ORDER BY id ASC
    `);
    const datalasttwo = resulttwo.rows;

    const twoarray = datalast.concat(datalasttwo);
    res.json(twoarray);
  } catch (error) {
    console.error('Error in GET /packing_a2_daily/date/:date:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 11. packing_a2_weekly (tanpa parameter)
app.get('/packing_a2_weekly', async (req, res) => {
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const weeklofmonth = getWeek(date);
    const dates = getWeekDates(year, month, weeklofmonth);

    const startweekdate = new Date(dates[0]);
    const startdate = format(startweekdate);
    const endweekdate = new Date(dates[6]);
    const enddate = format(endweekdate);

    const result = await req.db_iot.query(`
      SELECT id, counter, jam, realdatetime
      FROM purwosari.packing_a2
      WHERE graph = 'Y'
        AND tanggal BETWEEN '${startdate}' AND '${enddate}'
        AND jam IN ('14.58','22.58','6.59')
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a2_weekly:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 12. packing_a2_weekly dengan parameter date (misal "minggu ke-")
app.get('/packing_a2_weekly/date/:date', async (req, res) => {
  try {
    const datethis = parseInt(req.params.date, 10); // misal "week number"
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Dapatkan 7 tanggal dari minggu ke-n (datethis) di bulan ini
    const dates = getWeekDates(year, month, datethis);

    const startweekdate = new Date(dates[0]);
    const startdate = format(startweekdate);
    const endweekdate = new Date(dates[6]);
    const enddate = format(endweekdate);

    const result = await req.db_iot.query(`
      SELECT id, counter, jam, realdatetime
      FROM purwosari.packing_a2
      WHERE graph = 'Y'
        AND tanggal BETWEEN '${startdate}' AND '${enddate}'
        AND jam IN ('14.58','22.58','6.59')
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a2_weekly/date/:date:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default app;
