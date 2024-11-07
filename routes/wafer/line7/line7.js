
import { Router } from 'express';
import moment from 'moment';
const app = Router();
function format(date) {
    if (!(date instanceof Date)) {
        throw new Error('Invalid "date" argument. You must pass a date instance');
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function getMonthWeek(year, month, week) {
    // Set date to 4th of month
    let d = new Date(year, month - 1, 4);
    // Get day number, set Sunday to 7
    let day = d.getDay() || 7;
    // Set to prior Monday
    d.setDate(d.getDate() - day + 1);
    // Set to required week
    d.setDate(d.getDate() + 7 * (week - 1));
    return d;
}
function getWeek(date) {
    let monthStart = new Date(date);
    monthStart.setDate(0);
    let offset = (monthStart.getDay() + 1) % 7 - 1;
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
app.get('/packing_l7', async (req, res) => {
    const result = await req.db.query('SELECT * FROM automation.packing_l7 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift1_l7', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await req.db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_l7', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await req.db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_l7', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await req.db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await req.db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisyestertime}' 
        AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/shift1_l7_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await req.db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('7.45','8.45','9.45','10.45','11.45','12.45','13.45','14.44') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_l7_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await req.db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('15.45','16.45','17.45','18.45','19.45','20.45','21.45','22.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_l7_hourly', async (req, res) => {
     // Ambil tanggal hari ini dalam format 'YYYY-MM-DD'
     const thisdaytime = moment().format('YYYY-MM-DD'); // Tanggal monitoring, misal: '2024-11-07'

     // Tentukan tanggal berikutnya
     const nextDate = moment(thisdaytime).add(1, 'days').format('YYYY-MM-DD');
 
     // Ambil data untuk jam '23.45' pada tanggal hari ini
     const resultone = await req.db.query(`
         SELECT * FROM (
             SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
             FROM automation.packing_l7
             WHERE graph = 'Y' AND tanggal = '${thisdaytime}' 
             AND jam = '23.45'
             ORDER BY jam, id ASC
         ) AS distinct_data_one
         ORDER BY id ASC
     `);
     const datalastone = resultone.rows;
 
     // Sesuaikan data untuk jam '0.45' dari jam '23.45' pada tanggal hari ini
     let cart = datalastone.map(row => ({
         jam: "23.45",
         cntr_bandet: row.cntr_bandet,
         cntr_carton: row.cntr_carton
     }));
 
     // Ambil data untuk jam '0.45' hingga '6.45' pada tanggal berikutnya
     const resulttwo = await req.db.query(`
         SELECT * FROM (
             SELECT DISTINCT ON (jam) id, cntr_bandet, cntr_carton, jam
             FROM automation.packing_l7
             WHERE graph = 'Y' AND tanggal = '${nextDate}' 
             AND jam IN ('0.45','1.45','2.45','3.45','4.45','5.45','6.45')
             ORDER BY jam, id ASC
         ) AS distinct_data_two
         ORDER BY id ASC
     `);
 
     const datalasttwo = resulttwo.rows;
 
     // Gabungkan data jam '23.45' hari ini dengan data jam '0.45' hingga '6.45' hari berikutnya
     const twoarray = cart.concat(datalasttwo);
 
     // Kirim data sebagai respons
     res.send(twoarray);
});
app.get('/packing_l7_all', async (req, res) => {
    const result = await req.db.query(`SELECT * FROM automation.packing_l7 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_l7_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await req.db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await req.db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_l7_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await req.db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await req.db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_l7_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await req.db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await req.db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_l7_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await req.db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.45','22.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await req.db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.45') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_l7_weekly', async (req, res) => {
    let dates = [];
    var date = new Date();
    var year = date.getFullYear()
    var month = String(date.getMonth() + 1).padStart(2)
    var weeklofmonth = getWeek(date);
    dates = getWeekDates(year, month, weeklofmonth)

    var startweekdate = new Date(dates[0]);
    var startdate = format(startweekdate)
    console.log("Real Star Date", startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    console.log("Real End Date", enddate)
    // console.log(datethis)
    const result = await req.db.query(`SELECT id ,cntr_bandet, cntr_carton , jam , realdatetime  FROM automation.packing_l7 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_l7_weekly/date/:date', async (req, res) => {
    var datethis = req.params.date
    let dates = [];
    var date = new Date();
    var year = date.getFullYear()
    var month = String(date.getMonth() + 1).padStart(2)
    // var weeklofmonth = getWeek(date);
    dates = getWeekDates(year, month, datethis)

    var startweekdate = new Date(dates[0]);
    var startdate = format(startweekdate)
    console.log("Real Star Date", startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    console.log("Real End Date", enddate)
    // console.log(datethis)
    const result = await req.db.query(`SELECT id ,cntr_bandet, cntr_carton , jam , realdatetime  FROM automation.packing_l7 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
export default app;
