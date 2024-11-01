
import { Router } from "express";
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

app.get('/packing_a2', async (req, res) => {
    const result = await req.db_iot.query('SELECT * FROM purwosari.packing_a2 ORDER BY id DESC LIMIT 1');
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a2_all', async (req, res) => {
    const result = await req.db_iot.query(`SELECT * FROM purwosari.packing_a2 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a2_counter', async (req, res) => {
    const result = await req.db_iot.query('SELECT counter FROM purwosari.packing_a2 ORDER BY id DESC LIMIT 7');
    // console.log("DATA", result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/shift1_a2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await req.db_iot.query(`SELECT counter , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('6.46', '7.0', '7.30', '8.0', '8.30', '9.0', '9.30', '10.0', '10.30', '11.0', '11.30', '12.0', '12.30', '13.0', '13.30', '14.0', '14.30', '14.44') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_a2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await req.db_iot.query(`SELECT counter , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('14.46', '15.30', '16.00', '16.30', '17.00', '17.30', '18.00', '18.30', '19.00', '19.30', '20.00', '20.30', '21.00', '21.30', '22.00', '22.30', '22.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_a2', async (req, res) => {
    var thisdaytime = format(new Date());
    // console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await req.db_iot.query(`SELECT counter , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '22.45' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await req.db_iot.query(`SELECT counter , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.45') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_a2_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await req.db_iot.query(`SELECT id , counter,time , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a2_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    // console.log(datethis)
    const result = await req.db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await req.db_iot.query(`SELECT id ,counter,time , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a2_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await req.db_iot.query(`SELECT id ,counter , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await req.db_iot.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM purwosari.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_a2_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    // console.log(datethis)
    const result = await req.db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await req.db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a2_weekly', async (req, res) => {
    let dates = [];
    var date = new Date();
    var year = date.getFullYear()
    var month = String(date.getMonth() + 1).padStart(2)
    var weeklofmonth = getWeek(date);
    dates = getWeekDates(year, month, weeklofmonth)

    var startweekdate = new Date(dates[0]);
    var startdate = format(startweekdate)
    // console.log("Real Star Date", startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    // console.log("Real End Date", enddate)
    // console.log(datethis)
    const result = await req.db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_a2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a2_weekly/date/:date', async (req, res) => {
    var datethis = req.params.date
    let dates = [];
    var date = new Date();
    var year = date.getFullYear()
    var month = String(date.getMonth() + 1).padStart(2)
    // var weeklofmonth = getWeek(date);
    dates = getWeekDates(year, month, datethis)

    var startweekdate = new Date(dates[0]);
    var startdate = format(startweekdate)
    // console.log("Real Star Date", startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    // console.log("Real End Date", enddate)
    // console.log(datethis)
    const result = await req.db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_a2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
export default app;