// packingA1Routes.js
import { Router } from 'express';

const app = Router();

/**
 * Middleware untuk memeriksa koneksi database
 * Pastikan req.db_iot telah disiapkan sebelum router ini digunakan
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
 */
function getWeek(date) {
  let monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  // offset = jumlah hari sebelum minggu "penuh" dimulai
  // Hitungan manual agar sesuai definisi "minggu ke-n" di kebutuhan Anda
  let offset = (monthStart.getDay() + 6) % 7; 
  // Rumus perkiraan minggu
  return Math.ceil((date.getDate() + offset) / 7);
}

/**
 * Mengembalikan array 7 tanggal (string) untuk minggu ke-n di (year, month)
 */
function getWeekDates(year, month, week) {
  let d = getMonthWeek(year, month, week);
  let arr = [];
  for (let i = 0; i < 7; i++) {
    arr.push(format(d));
    d.setDate(d.getDate() + 1);
  }
  return arr;
}

// ===================== ROUTES =====================

// 1. Ambil data terakhir
app.get('/packing_a1', async (req, res) => {
  try {
    const result = await req.db_iot.query(
      'SELECT * FROM purwosari.packing_a1 ORDER BY id DESC LIMIT 1'
    );
    const datalast = result.rows;

    if (!datalast || datalast.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }
    res.json(datalast);
  } catch (error) {
    console.error('Error in GET /packing_a1:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Ambil semua data (yang graph = 'Y')
app.get('/packing_a1_all', async (req, res) => {
  try {
    const result = await req.db_iot.query(
      "SELECT * FROM purwosari.packing_a1 WHERE graph = 'Y' ORDER BY id DESC"
    );
    const datalast = result.rows;
    res.json(datalast);
  } catch (error) {
    console.error('Error in GET /packing_a1_all:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Ambil 7 data counter terakhir
app.get('/packing_a1_counter', async (req, res) => {
  try {
    const result = await req.db_iot.query(
      'SELECT counter FROM purwosari.packing_a1 ORDER BY id DESC LIMIT 7'
    );
    const datalast = result.rows;
    let arr = datalast.map((row) => row.counter);
    res.json(arr);
  } catch (error) {
    console.error('Error in GET /packing_a1_counter:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Shift 1
app.get('/shift1_a1', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db_iot.query(`
      SELECT counter, jam 
      FROM purwosari.packing_a1 
      WHERE graph = 'Y' 
        AND tanggal = '${thisdaytime}'
        AND jam in (
          '6.47','7.0','7.30','8.0','8.30','9.0','9.30','10.0',
          '10.30','11.0','11.30','12.0','12.30','13.0','13.30',
          '14.0','14.30','14.45'
        ) 
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /shift1_a1:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Shift 2
app.get('/shift2_a1', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db_iot.query(`
      SELECT counter, jam 
      FROM purwosari.packing_a1 
      WHERE graph = 'Y' 
        AND tanggal = '${thisdaytime}'
        AND jam in (
          '14.47','15.30','16.00','16.30','17.00','17.30','18.00',
          '18.30','19.00','19.30','20.00','20.30','21.00','21.30',
          '22.00','22.30','22.45'
        ) 
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /shift2_a1:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Shift 3 (gabungan data jam 22.47 di hari ini + jam 0.30 s/d 6.45 di hari berikutnya)
app.get('/shift3_a1', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const thisdate = new Date();
    // Untuk ambil data shift di "hari berikutnya" (00:30 - 06:31)
    thisdate.setDate(thisdate.getDate() + 1);
    const thisyestertime = format(thisdate);

    // Bagian jam 22.47
    const resultone = await req.db_iot.query(`
      SELECT counter, jam 
      FROM purwosari.packing_a1 
      WHERE graph = 'Y' 
        AND tanggal = '${thisdaytime}'
        AND jam = '22.47'
      ORDER BY id ASC
    `);
    const datalastone = resultone.rows;

    // Kita modifikasi jam 22.47 agar terbaca seperti jam 0.23? 
    // (sesuai logic aslinya di kode, tapi ini optional)
    let cart = [];
    if (datalastone.length > 0) {
      let element = {};
      // Menyamakan "style jam" jadi 0.23
      element.jam = '0.23';
      element.counter = datalastone[0].counter;
      cart.push(element);
    }

    // Bagian jam 0.30 s/d 6.45
    const resulttwo = await req.db_iot.query(`
      SELECT counter, jam 
      FROM purwosari.packing_a1 
      WHERE graph = 'Y' 
        AND tanggal = '${thisyestertime}'
        AND jam in (
          '0.30','1.0','1.31','2.0','2.31','3.0','3.31','4.0',
          '4.31','5.0','5.31','6.0','6.31','6.45'
        )
      ORDER BY id ASC
    `);
    const datalasttwo = resulttwo.rows;

    const merged = cart.concat(datalasttwo);
    res.json(merged);
  } catch (error) {
    console.error('Error in GET /shift3_a1:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 7. packing_a1_hourly
app.get('/packing_a1_hourly', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db_iot.query(`
      SELECT id, counter, time, jam
      FROM purwosari.packing_a1
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam in (
          '8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58',
          '16.0','17.0','18.0','19.0','20.0','21.0','22.0',
          '22.58','23.58'
        )
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a1_hourly:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 8. packing_a1_hourly dengan parameter date
app.get('/packing_a1_hourly/date/:date', async (req, res) => {
  try {
    const datethis = req.params.date;
    // Data dari hari `datethis`
    const result = await req.db_iot.query(`
      SELECT id, counter, time, jam
      FROM purwosari.packing_a1
      WHERE graph = 'Y'
        AND tanggal = '${datethis}'
        AND jam in (
          '8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58',
          '16.0','17.0','18.0','19.0','20.0','21.0','22.0',
          '22.58','23.58'
        )
      ORDER BY id ASC
    `);
    const datalast = result.rows;

    // Data dari hari berikutnya (jam 1.0 s/d 6.59)
    const thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1);
    const thisyestertime = format(thisdate);

    const resulttwo = await req.db_iot.query(`
      SELECT id, counter, time, jam
      FROM purwosari.packing_a1
      WHERE graph = 'Y'
        AND tanggal = '${thisyestertime}'
        AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59')
      ORDER BY id ASC
    `);

    const datalasttwo = resulttwo.rows;
    const twoarray = datalast.concat(datalasttwo);
    res.json(twoarray);
  } catch (error) {
    console.error('Error in GET /packing_a1_hourly/date/:date:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 9. packing_a1_daily
app.get('/packing_a1_daily', async (req, res) => {
  try {
    const thisdaytime = format(new Date());
    const result = await req.db_iot.query(`
      SELECT id, counter, jam
      FROM purwosari.packing_a1
      WHERE graph = 'Y'
        AND tanggal = '${thisdaytime}'
        AND jam in ('14.58','22.58')
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a1_daily:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 10. packing_a1_daily dengan parameter date
app.get('/packing_a1_daily/date/:date', async (req, res) => {
  try {
    const datethis = req.params.date;
    // Data pada tanggal yang diminta
    const result = await req.db_iot.query(`
      SELECT id, counter, jam
      FROM purwosari.packing_a1
      WHERE graph = 'Y'
        AND tanggal = '${datethis}'
        AND jam in ('14.58','22.58')
      ORDER BY id ASC
    `);
    const datalast = result.rows;

    // Data jam 6.59 di hari berikutnya
    const thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1);
    const thisyestertime = format(thisdate);

    const resulttwo = await req.db_iot.query(`
      SELECT id, counter, jam
      FROM purwosari.packing_a1
      WHERE graph = 'Y'
        AND tanggal = '${thisyestertime}'
        AND jam in ('6.59')
      ORDER BY id ASC
    `);

    const datalasttwo = resulttwo.rows;
    const twoarray = datalast.concat(datalasttwo);
    res.json(twoarray);
  } catch (error) {
    console.error('Error in GET /packing_a1_daily/date/:date:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 11. packing_a1_weekly (tanpa parameter)
app.get('/packing_a1_weekly', async (req, res) => {
  try {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let weekOfMonth = getWeek(date);

    // Mendapatkan 7 tanggal dari minggu ke- sekian
    let dates = getWeekDates(year, month, weekOfMonth);

    // Awal dan akhir minggu
    let startdate = format(new Date(dates[0]));
    let enddate = format(new Date(dates[6]));

    const result = await req.db_iot.query(`
      SELECT id, counter, jam, realdatetime
      FROM purwosari.packing_a1
      WHERE graph = 'Y'
        AND tanggal BETWEEN '${startdate}' AND '${enddate}'
        AND jam in ('14.58','22.58','6.59')
      ORDER BY id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a1_weekly:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 12. packing_a1_weekly dengan parameter date (misal "week number")
app.get('/packing_a1_weekly/date/:date', async (req, res) => {
  try {
    // Param 'date' di sini dianggap mewakili "minggu ke-berapa"?
    const weekNumber = parseInt(req.params.date, 10);

    let currentDate = new Date();
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth() + 1;

    // Dapatkan 7 tanggal dari "minggu ke- (weekNumber)" di bulan ini
    let dates = getWeekDates(year, month, weekNumber);

    // Awal dan akhir minggu
    let startdate = format(new Date(dates[0]));
    let enddate = format(new Date(dates[6]));

    const result = await req.db_iot.query(`
      SELECT id, counter, jam, realdatetime
      FROM purwosari.packing_a1
      WHERE graph = 'Y'
        AND tanggal BETWEEN '${startdate}' AND '${enddate}'
        AND jam in ('14.58','22.58','6.59')
      ORDER BY id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /packing_a1_weekly/date/:date:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default app;
