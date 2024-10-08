const express = require('express');
var fs = require('fs');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
var jwt = require('jsonwebtoken');
var https = require('https');
const db = require('./config/util');


const app = express();
const corsPerRoute = cors();


app.use(logger('dev'));
var corsOptions = {
    origin: "*"
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT ,DELETE");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});
app.get('/', function (req, res) {
    res.json({ "Welcome": "Selamat Datang di API RESMI KAMI" });
});

function validateUser(req, res, next) {
    jwt.verify(req.headers['x-access-token'], req.app.get('secretKey'), function (err, decoded) {
        if (err) {
            res.json({ status: "error", message: err.message, data: null });
        } else {
            // add user id to request
            req.body.userId = decoded.id;
            next();
        }
    });

}

app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/login', require('./routes/auth/register'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

function format(date) {
    if (!(date instanceof Date)) {
        throw new Error('Invalid "date" argument. You must pass a date instance')
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
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
    let offset = (monthStart.getDay() + 1) % 7 - 1; // -1 is for a week starting on Monday
    return Math.ceil((date.getDate() + offset) / 7);
}
// Return array of dates for specified week of month of year
function getWeekDates(year, month, week) {
    let d = getMonthWeek(year, month, week);
    for (var i = 0, arr = []; i < 7; i++) {

        // Array of date strings
        arr.push(d.toLocaleDateString());

        // For array of Date objects, replace above with
        // arr.push(new Date(d));

        // Increment date
        d.setDate(d.getDate() + 1);
    }
    return arr;
}
//Central Kitchen
app.get('/cenkit_l1', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.cenkit_l1 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift1_cenkit_l1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT cntr_mixing, temp_water , temp_cooling , jam FROM automation.cenkit_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_cenkit_l1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT cntr_mixing, temp_water , temp_cooling ,jam FROM automation.cenkit_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_cenkit_l1', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT cntr_mixing, temp_water , temp_cooling , jam FROM automation.cenkit_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT cntr_mixing, temp_water , temp_cooling , jam FROM automation.cenkit_l1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
        AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/cenkit_l1_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.cenkit_l1 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/cenkit_l1_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling , jam FROM automation.cenkit_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/cenkit_l1_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling  , jam FROM automation.cenkit_l1 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling  , jam FROM automation.cenkit_l1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/cenkit_l1_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling  , jam FROM automation.cenkit_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/cenkit_l1_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling  , jam FROM automation.cenkit_l1 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling  , jam FROM automation.cenkit_l1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/cenkit_l1_weekly', async (req, res) => {
    let dates = [];
    var date = new Date();
    var year = date.getFullYear()
    var month = String(date.getMonth() + 1).padStart(2)
    var weeklofmonth = getWeek(date);
    dates = getWeekDates(year, month, weeklofmonth)

    var startweekdate = new Date(dates[0]);
    var startdate = format(startweekdate)
    // console.log("Real Star Date" ,startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    // console.log("Real End Date" ,enddate)
    // console.log(datethis)
    const result = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling  , jam , realdatetime  FROM automation.cenkit_l1 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/cenkit_l1_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling , jam , realdatetime  FROM automation.cenkit_l1 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/util_cenkit/:type', async (req, res) => {
    var typeapa = req.params.type
    const result = await db.query(`SELECT * FROM utility.mdpsub1_utility where type = '${typeapa}' AND grup = 'ckwafer' ORDER BY id DESC LIMIT 1`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift1_util_cenkit/:type', async (req, res) => {
    var typeapa = req.params.type
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where type = '${typeapa}' AND grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_util_cenkit/:type', async (req, res) => {
    var typeapa = req.params.type
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT tegangan,arus,daya,cost,kw,used,jam  FROM utility.mdpsub1_utility where type = '${typeapa}' AND grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_util_cenkit/:type', async (req, res) => {
    var typeapa = req.params.type
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where type = '${typeapa}' AND grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where type = '${typeapa}' AND grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisyestertime}' 
        AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/util_cenkit_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/util_cenkit_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/util_cenkit_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/util_cenkit_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/util_cenkit_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/util_cenkit_weekly', async (req, res) => {
    let dates = [];
    var date = new Date();
    var year = date.getFullYear()
    var month = String(date.getMonth() + 1).padStart(2)
    var weeklofmonth = getWeek(date);
    dates = getWeekDates(year, month, weeklofmonth)

    var startweekdate = new Date(dates[0]);
    var startdate = format(startweekdate)
    // console.log("Real Star Date" ,startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    // console.log("Real End Date" ,enddate)
    // console.log(datethis)
    const result = await db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam , realdatetime  FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/util_cenkit_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,tegangan,arus,daya,cost,kw,used,jam , realdatetime  FROM utility.mdpsub1_utility where grup = 'ckwafer' AND graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/cenkit_l2', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.cenkit_l2 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift1_cenkit_l2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT cntr_mixing, temp_water , temp_cooling , jam FROM automation.cenkit_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_cenkit_l2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT cntr_mixing, temp_water , temp_cooling,jam  FROM automation.cenkit_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_cenkit_l2', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT cntr_mixing, temp_water , temp_cooling , jam FROM automation.cenkit_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT cntr_mixing, temp_water , temp_cooling , jam FROM automation.cenkit_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
        AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/cenkit_l2_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.cenkit_l2 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/cenkit_l2_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling , jam FROM automation.cenkit_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/cenkit_l2_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling  , jam FROM automation.cenkit_l2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling  , jam FROM automation.cenkit_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/cenkit_l2_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling  , jam FROM automation.cenkit_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/cenkit_l2_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling  , jam FROM automation.cenkit_l2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling  , jam FROM automation.cenkit_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/cenkit_l2_weekly', async (req, res) => {
    let dates = [];
    var date = new Date();
    var year = date.getFullYear()
    var month = String(date.getMonth() + 1).padStart(2)
    var weeklofmonth = getWeek(date);
    dates = getWeekDates(year, month, weeklofmonth)

    var startweekdate = new Date(dates[0]);
    var startdate = format(startweekdate)
    // console.log("Real Star Date" ,startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    // console.log("Real End Date" ,enddate)
    // console.log(datethis)
    const result = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling  , jam , realdatetime  FROM automation.cenkit_l2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/cenkit_l2_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,cntr_mixing, temp_water , temp_cooling , jam , realdatetime  FROM automation.cenkit_l2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//line2
app.get('/packing_l2', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.packing_l2 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift_l2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT shift1, shift2, shift3 FROM automation.counter_shift_l2 where tanggal = '${thisdaytime}' ORDER BY id DESC LIMIT 1`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift1_l2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_l2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_l2', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
        AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/shift1_l2_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_l2_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_l2_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.59' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.45') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);
    // }
});
app.get('/packing_l2_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.packing_l2 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_l2_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_l2_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_l2_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_l2_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.45','22.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.45') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_l2_weekly', async (req, res) => {
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
    const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam , realdatetime  FROM automation.packing_l2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_l2_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam , realdatetime  FROM automation.packing_l2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//line1
app.get('/packing_l1', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.packing_l1 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift_l1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT shift1, shift2, shift3 FROM automation.counter_shift_l1 where tanggal = '${thisdaytime}' ORDER BY id DESC LIMIT 1`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift1_l1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_l1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_l1', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
        AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/shift1_l1_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_l1_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_l1_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.59' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.45') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);
    // }
});
app.get('/packing_l1_all', async (req, res) => {
    const result = await db.query(`SELECT *  FROM automation.packing_l1 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_l1_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_l1_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_l1_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_l1_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.45','22.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.45') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_l1_weekly', async (req, res) => {
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
    const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam , realdatetime  FROM automation.packing_l1 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_l1_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam , realdatetime  FROM automation.packing_l1 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});

//line7
// app.get('/packing_l7', async (req, res) => {
//     const result = await db.query('SELECT * FROM automation.packing_l7 ORDER BY id DESC LIMIT 1');
//     // console.log("DATA" ,result)
//     var datalast = result.rows;
//     res.send(datalast);
// });
// app.get('/shift_l7', async (req, res) => {
//     var thisdaytime = format(new Date());
//     const result = await db.query(`SELECT shift1, shift2, shift3 FROM automation.counter_shift_l7 where tanggal = '${thisdaytime}' ORDER BY id DESC LIMIT 1`);
//     //console.log("DATA" ,result)
//     var datalast = result.rows;
//     res.send(datalast);
// });
// app.get('/shift1_l7', async (req, res) => {
//         var thisdaytime = format(new Date());
//         const result = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
//         AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
//         //console.log("DATA" ,result)
//         var datalast = result.rows;
//         res.send(datalast);
// });
// app.get('/shift2_l7', async (req, res) => {
//     var thisdaytime = format(new Date());
//         const result = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
//         AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
//         //console.log("DATA" ,result)
//         var datalast = result.rows;
//         res.send(datalast);
//     // }
// });
// app.get('/shift3_l7', async (req, res) => {
//         var thisdaytime = format(new Date());
//         console.log(thisdaytime)
//         var thisdate = new Date();
//         thisdate.setDate(thisdate.getDate() + 1)
//         var thisyestertime = format(thisdate)
//         const resultone = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
//         AND jam = '23.0' ORDER BY id ASC`);
//         var datalastone = resultone.rows;
//         let element = {};
//         var cart = [];
//         for (let index = 0; index < datalastone.length; index++) {
//             element.jam = "0." + 23
//             element.counter = datalastone[index].counter
//             cart.push(element)
//         }
//         const resulttwo = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisyestertime}' 
//         AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
//         var datalasttwo = resulttwo.rows;
//         var twoarray = cart.concat(datalasttwo)
//         res.send(twoarray);

//     // }
// });
// app.get('/shift1_l7_hourly', async (req, res) => {
//     var thisdaytime = format(new Date());
//     const result = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
//     AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.45') ORDER BY id ASC`);
//     //console.log("DATA" ,result)
//     var datalast = result.rows;
//     res.send(datalast);
// });
// app.get('/shift2_l7_hourly', async (req, res) => {
// var thisdaytime = format(new Date());
//     const result = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
//     AND jam in ('16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.45') ORDER BY id ASC`);
//     //console.log("DATA" ,result)
//     var datalast = result.rows;
//     res.send(datalast);
// // }
// });
// app.get('/shift3_l7_hourly', async (req, res) => {
//     var thisdaytime = format(new Date());
//     console.log(thisdaytime)
//     var thisdate = new Date();
//     thisdate.setDate(thisdate.getDate() + 1)
//     var thisyestertime = format(thisdate)
//     const resultone = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
//     AND jam = '23.59' ORDER BY id ASC`);
//     var datalastone = resultone.rows;
//     let element = {};
//     var cart = [];
//     for (let index = 0; index < datalastone.length; index++) {
//         element.jam = "0." + 23
//         element.counter = datalastone[index].counter
//         cart.push(element)
//     }
//     const resulttwo = await db.query(`SELECT cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisyestertime}' 
//     AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.45') ORDER BY id ASC`);
//     var datalasttwo = resulttwo.rows;
//     var twoarray = cart.concat(datalasttwo)
//     res.send(twoarray);
// // }
// });
// app.get('/packing_l7_all', async (req, res) => {
//     const result = await db.query(`SELECT * FROM automation.packing_l7 where graph = 'Y' ORDER BY id DESC`);
//     // console.log("DATA" ,result)
//     var datalast = result.rows;
//     res.send(datalast);
// });
// app.get('/packing_l7_hourly', async (req, res) => {
//     var thisdaytime = format(new Date());
//     const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
//     AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
//     //console.log("DATA" ,result)
//     var datalast = result.rows;
//     // var thisdate = new Date(datethis);
//     // thisdate.setDate(thisdate.getDate() + 1)
//     // var thisyestertime = format(thisdate)
//     // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisyestertime}' 
//     // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
//     // var datalasttwo = resulttwo.rows;
//     // var twoarray = datalast.concat(datalasttwo)
//     res.send(datalast);
// });
// app.get('/packing_l7_hourly/date/:date', async (req, res) => {
//     var datethis = req.params.date
//     console.log(datethis)
//     const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${datethis}' 
//     AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
//     //console.log("DATA" ,result)
//     var datalast = result.rows;
//     var thisdate = new Date(datethis);
//     thisdate.setDate(thisdate.getDate() + 1)
//     var thisyestertime = format(thisdate)
//     const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisyestertime}' 
//     AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
//     var datalasttwo = resulttwo.rows;
//     var twoarray = datalast.concat(datalasttwo)
//     res.send(twoarray);
// });
// app.get('/packing_l7_daily', async (req, res) => {
//     var thisdaytime = format(new Date());
//     const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisdaytime}' 
//     AND jam in ('14.58','22.58') ORDER BY id ASC`);
//     //console.log("DATA" ,result)
//     var datalast = result.rows;
//     // var thisdate = new Date(datethis);
//     // thisdate.setDate(thisdate.getDate() + 1)
//     // var thisyestertime = format(thisdate)
//     // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisyestertime}' 
//     // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
//     // var datalasttwo = resulttwo.rows;
//     // var twoarray = datalast.concat(datalasttwo)
//     res.send(datalast);
// });
// app.get('/packing_l7_daily/date/:date', async (req, res) => {
//     var datethis = req.params.date
//     console.log(datethis)
//     const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${datethis}' 
//     AND jam in ('14.45','22.45') ORDER BY id ASC`);
//     //console.log("DATA" ,result)
//     var datalast = result.rows;
//     var thisdate = new Date(datethis);
//     thisdate.setDate(thisdate.getDate() + 1)
//     var thisyestertime = format(thisdate)
//     const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l7 where graph = 'Y' AND tanggal = '${thisyestertime}' 
//     AND jam in ('6.45') ORDER BY id ASC`);
//     var datalasttwo = resulttwo.rows;
//     var twoarray = datalast.concat(datalasttwo)
//     res.send(twoarray);
// });
// app.get('/packing_l7_weekly', async (req, res) => {
//     let dates = [];
//     var date = new Date();
//     var year = date.getFullYear()
//     var month = String(date.getMonth() + 1).padStart(2)
//     var weeklofmonth = getWeek(date);
//     dates = getWeekDates(year,month,weeklofmonth)

//     var startweekdate = new Date(dates[0]);
//     var startdate = format(startweekdate)
//     console.log("Real Star Date" ,startdate)
//     var endweekdate = new Date(dates[6]);
//     var enddate = format(endweekdate)
//     console.log("Real End Date" ,enddate)
//     // console.log(datethis)
//     const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam , realdatetime  FROM automation.packing_l7 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
//     AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
//     var datalast = result.rows;
//     res.send(datalast);
// });
// app.get('/packing_l7_weekly/date/:date', async (req, res) => {
//     var datethis = req.params.date
//     let dates = [];
//     var date = new Date();
//     var year = date.getFullYear()
//     var month = String(date.getMonth() + 1).padStart(2)
//     // var weeklofmonth = getWeek(date);
//     dates = getWeekDates(year,month,datethis)

//     var startweekdate = new Date(dates[0]);
//     var startdate = format(startweekdate)
//     console.log("Real Star Date" ,startdate)
//     var endweekdate = new Date(dates[6]);
//     var enddate = format(endweekdate)
//     console.log("Real End Date" ,enddate)
//     // console.log(datethis)
//     const result = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam , realdatetime  FROM automation.packing_l7 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
//     AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
//     var datalast = result.rows;
//     res.send(datalast);
// });

//PACKING B3
app.get('/shift1_b3', async (req, res) => {
    var thisdaytime = format(new Date());
    // var thisjam = jamnya(new Date());

    // var verif2 = thisjam.toString().slice(0,2);
    // var verif3 = thisjam.toString().slice(-2);
    // var verif2 = 14;
    // if (verif2 >= 7 && verif2 <= 14 ) {
    const result = await db.query(`SELECT counter , jam FROM automation.packing_b3 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }else if( verif2 >= 15 && verif2 <= 23){
    //     const result = await db.query(`SELECT counter , jam FROM automation.packing_b3 where tanggal = '${thisdaytime}' 
    //     AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //     //console.log("DATA" ,result)
    //     var datalast = result.rows;
    //     res.send(datalast);
    // }else {
    //     const result = await db.query(`SELECT counter , jam FROM automation.packing_b3 where tanggal = '${thisdaytime}' 
    //     AND jam in ('23.0','23.31','23.58','1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    //     //console.log("DATA" ,result)
    //     var datalast = result.rows;
    //     res.send(datalast);

    // }
});
app.get('/shift2_b3', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_b3 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_b3', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT counter , jam FROM automation.packing_b3 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT counter , jam FROM automation.packing_b3 where graph = 'Y' AND tanggal = '${thisyestertime}' 
        AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_b3', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.packing_b3 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b3_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.packing_b3 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b3_counter', async (req, res) => {
    const result = await db.query('SELECT counter FROM automation.packing_b3 ORDER BY id DESC LIMIT 7');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/packing_b3_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id , counter,time , jam FROM automation.packing_b3 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b3_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_b3 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_b3 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b3_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,counter , jam FROM automation.packing_b3 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_b3_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter, jam FROM automation.packing_b3 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter, jam FROM automation.packing_b3 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b3_weekly', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_b3 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b3_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_b3 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING B1
app.get('/shift1_b1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_b1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_b1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_b1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_b1', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT counter , jam FROM automation.packing_b1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT counter , jam FROM automation.packing_b1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_b1', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.packing_b1 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b1_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.packing_b1 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b1_counter', async (req, res) => {
    const result = await db.query('SELECT counter FROM automation.packing_b1 ORDER BY id DESC LIMIT 7');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/packing_b1_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id , counter ,time, jam FROM automation.packing_b1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b1_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_b1 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_b1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b1_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,counter , jam FROM automation.packing_b1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_b1_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter, jam FROM automation.packing_b1 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter, jam FROM automation.packing_b1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b1_weekly', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_b1 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b1_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_b1 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING B2
app.get('/shift1_b2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_b2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_b2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_b2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_b2', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT counter , jam FROM automation.packing_b2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT counter , jam FROM automation.packing_b2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_b2', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.packing_b2 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b2_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.packing_b2 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b2_counter', async (req, res) => {
    const result = await db.query('SELECT counter FROM automation.packing_b2 ORDER BY id DESC LIMIT 7');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/packing_b2_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id , counter,time , jam FROM automation.packing_b2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b2_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_b2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_b2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b2_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,counter , jam FROM automation.packing_b2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_b2_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter, jam FROM automation.packing_b2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter, jam FROM automation.packing_b2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b2_weekly', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_b2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b2_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_b2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING B4
app.get('/shift1_b4', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_b4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_b4', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_b4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_b4', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT counter , jam FROM automation.packing_b4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT counter , jam FROM automation.packing_b4 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_b4', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.packing_b4 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b4_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.packing_b4 where graph = 'Y' ORDER BY id DESC`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b4_counter', async (req, res) => {
    const result = await db.query('SELECT counter FROM automation.packing_b4 ORDER BY id DESC LIMIT 7');
    console.log("DATA", result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/packing_b4_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id , counter ,time, jam FROM automation.packing_b4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b4_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_b4 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_b4 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b4_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,counter , jam FROM automation.packing_b4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_b4_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter, jam FROM automation.packing_b4 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter, jam FROM automation.packing_b4 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b4_weekly', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_b4 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b4_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_b4 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING A4
app.get('/shift1_a4', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_a4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_a4', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_a4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_a4', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT counter , jam FROM automation.packing_a4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT counter , jam FROM automation.packing_a4 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_a4', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.packing_a4 ORDER BY id DESC LIMIT 1');
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a4_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.packing_a4 where graph = 'Y' ORDER BY id DESC`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a4_counter', async (req, res) => {
    const result = await db.query('SELECT counter FROM automation.packing_a4 ORDER BY id DESC LIMIT 7');
    console.log("DATA", result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/packing_a4_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id , counter ,time, jam FROM automation.packing_a4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a4_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_a4 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_a4 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a4_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,counter , jam FROM automation.packing_a4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_a4_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter, jam FROM automation.packing_a4 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter, jam FROM automation.packing_a4 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a4_weekly', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_a4 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a4_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_a4 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//lINE1
//packing A5
app.get('/packing_a5', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.packing_a5 ORDER BY id DESC LIMIT 1');
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a5_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.packing_a5 where graph = 'Y' ORDER BY id DESC`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a5_counter', async (req, res) => {
    const result = await db.query('SELECT counter FROM automation.packing_a5 ORDER BY id DESC LIMIT 7');
    console.log("DATA", result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/shift1_a5', async (req, res) => {
    var thisdaytime = format(new Date());
    // var thisjam = jamnya(new Date());

    // var verif2 = thisjam.toString().slice(0,2);
    // var verif3 = thisjam.toString().slice(-2);
    // var verif2 = 14;
    // if (verif2 >= 7 && verif2 <= 14 ) {
    const result = await db.query(`SELECT counter , jam FROM automation.packing_a5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }else if( verif2 >= 15 && verif2 <= 23){
    //     const result = await db.query(`SELECT counter , jam FROM automation.packing_b3 where tanggal = '${thisdaytime}' 
    //     AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //     //console.log("DATA" ,result)
    //     var datalast = result.rows;
    //     res.send(datalast);
    // }else {
    //     const result = await db.query(`SELECT counter , jam FROM automation.packing_b3 where tanggal = '${thisdaytime}' 
    //     AND jam in ('23.0','23.31','23.58','1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    //     //console.log("DATA" ,result)
    //     var datalast = result.rows;
    //     res.send(datalast);

    // }
});
app.get('/shift2_a5', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_a5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_a5', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT counter , jam FROM automation.packing_a5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT counter , jam FROM automation.packing_a5 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);
    // }
});
app.get('/packing_a5_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id , counter ,time, jam FROM automation.packing_a5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a5_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_a5 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_a5 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a5_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,counter , jam FROM automation.packing_a5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_a5_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter, jam FROM automation.packing_a5 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter, jam FROM automation.packing_a5 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a5_weekly', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_a5 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a5_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_a5 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING A1
app.get('/packing_a1', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.packing_a1 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a1_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.packing_a1 where graph = 'Y' ORDER BY id DESC`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a1_counter', async (req, res) => {
    const result = await db.query('SELECT counter FROM automation.packing_a1 ORDER BY id DESC LIMIT 7');
    console.log("DATA", result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/shift1_a1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_a1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_a1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_a1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_a1', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT counter , jam FROM automation.packing_a1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT counter , jam FROM automation.packing_a1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_a1_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id , counter,time, jam FROM automation.packing_a1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a1_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter,time, jam FROM automation.packing_a1 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter,time, jam FROM automation.packing_a1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a1_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,counter , jam FROM automation.packing_a1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_a1_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter, jam FROM automation.packing_a1 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter, jam FROM automation.packing_a1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a1_weekly', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_a1 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a1_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_a1 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING A2
app.get('/packing_a2', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.packing_a2 ORDER BY id DESC LIMIT 1');
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a2_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.packing_a2 where graph = 'Y' ORDER BY id DESC`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a2_counter', async (req, res) => {
    const result = await db.query('SELECT counter FROM automation.packing_a2 ORDER BY id DESC LIMIT 7');
    console.log("DATA", result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/shift1_a2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_a2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_a2', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT counter , jam FROM automation.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT counter , jam FROM automation.packing_a2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_a2_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id , counter,time , jam FROM automation.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a2_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_a2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter,time , jam FROM automation.packing_a2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a2_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,counter , jam FROM automation.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_a2_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter, jam FROM automation.packing_a2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter, jam FROM automation.packing_a2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
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
    console.log("Real Star Date", startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    console.log("Real End Date", enddate)
    // console.log(datethis)
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_a2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
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
    console.log("Real Star Date", startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    console.log("Real End Date", enddate)
    // console.log(datethis)
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_a2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING A3
app.get('/packing_a3', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.packing_a3 ORDER BY id DESC LIMIT 1');
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a3_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.packing_a3 where graph = 'Y' ORDER BY id DESC`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a3_counter', async (req, res) => {
    const result = await db.query('SELECT counter FROM automation.packing_a3 ORDER BY id DESC LIMIT 7');
    console.log("DATA", result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/shift1_a3', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_a3 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_a3', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_a3 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_a3', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT counter , jam FROM automation.packing_b3 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT counter , jam FROM automation.packing_b3 where graph = 'Y' AND tanggal = '${thisyestertime}' 
        AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_a3_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id , counter ,time, jam FROM automation.packing_a3 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a3_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_a3 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_a3 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a3_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,counter , jam FROM automation.packing_a3 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_a3_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter, jam FROM automation.packing_a3 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter, jam FROM automation.packing_a3 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a3_weekly', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_a3 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a3_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_a3 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING B5
app.get('/packing_b5', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.packing_b5 ORDER BY id DESC LIMIT 1');
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b5_all', async (req, res) => {
    const result = await db.query(`SELECT * FROM automation.packing_b5 where graph = 'Y' ORDER BY id DESC`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b5_counter', async (req, res) => {
    const result = await db.query('SELECT counter FROM automation.packing_b5 ORDER BY id DESC LIMIT 7');
    console.log("DATA", result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/shift1_b5', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_b5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('7.0','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_b5', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_b5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('15.0','15.31','16.0','16.31','17.0','17.31','18.0','18.31','19.0','19.31','20.0','20.31','21.0','21.31','22.0','22.31','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_b5', async (req, res) => {
    var thisdaytime = format(new Date());
    console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db.query(`SELECT counter , jam FROM automation.packing_b5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db.query(`SELECT counter , jam FROM automation.packing_b5 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_b5_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id , counter ,time, jam FROM automation.packing_b5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b5_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter,time , jam FROM automation.packing_b5 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter ,time, jam FROM automation.packing_b5 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b5_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id ,counter , jam FROM automation.packing_b5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM automation.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_b5_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id ,counter, jam FROM automation.packing_b5 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id ,counter, jam FROM automation.packing_b5 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b5_weekly', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_b5 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b5_weekly/date/:date', async (req, res) => {
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
    const result = await db.query(`SELECT id ,counter , jam , realdatetime  FROM automation.packing_b5 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.post('/lhp', async (req, res) => {
    var { realdatetime, grup, shift, sku, plan, real, ach, cello, cellocpp, ctn_type, cello_used, adonan_used, ccbcream_used, avgsheet, avgbook, sheet, book, cutkasar, bubukcuttig, sapuancut, qcpacking, qccello, packing_reject, banded, sapuanpack, buble, suppliercello, speed_mesin, kendala, sample_ctn_qc, banded_under, banded_over, cutoff_jam, ctn_luar, d_b, plastik_pof, coklat_used, sortir, pof_kue,users } = req.body;
    db.query('INSERT INTO automation.lhp (realdatetime ,grup, shift, sku ,plan,real,ach,cello,cellocpp,ctn_type,cello_used,adonan_used,ccbcream_used,avgsheet,avgbook,sheet,book,cutkasar,bubukcutting,sapuancut,qcpacking,qccello,packing_reject,banded,sapuanpack,buble,suppliercello,speed_mesin,kendala,sample_ctn_qc,banded_under,banded_over,cutoff_jam,ctn_luar,d_b,plastik_pof,coklat_used,sortir,pof_kue,user_input ) VALUES ($1, $2, $3,$4, $5, $6, $7, $8, $9,$10, $11, $12,$13, $14, $15,$16, $17, $18,$19, $20, $21,$22, $23, $24,$25, $26,$27, $28, $29,$30, $31, $32,$33,$34,$35,$36,$37,$38,$39,$40) RETURNING id',
        [realdatetime, grup, shift, sku, plan, real, ach, cello, cellocpp, ctn_type, cello_used, adonan_used, ccbcream_used, avgsheet, avgbook, sheet, book, cutkasar, bubukcuttig, sapuancut, qcpacking, qccello, packing_reject, banded, sapuanpack, buble, suppliercello, speed_mesin, kendala, sample_ctn_qc, banded_under, banded_over, cutoff_jam, ctn_luar, d_b, plastik_pof, coklat_used, sortir, pof_kue,users], (error, results) => {
            res.status(204).send(" added");
        })
});
app.get('/lhp', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.lhp ORDER BY id DESC LIMIT 1');
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhp/detail/:id', async (req, res) => {
    var id = req.params.id
    const result = await db.query(`SELECT * FROM automation.lhp where id = '${id}'`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhp_daily/:line', async (req, res) => {
    var line = req.params.line
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT id,shift,sku,plan,real,ach,packing_reject,sheet,book,banded,sapuanpack,buble FROM automation.lhp where realdatetime = '${thisdaytime}' AND grup = '${line}' 
    AND shift in ('Shift 1') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhp_daily/date/:date/:line', async (req, res) => {
    var line = req.params.line
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT id,shift,sku,plan,real,ach,packing_reject,sheet,book,banded,sapuanpack,buble FROM automation.lhp where realdatetime = '${datethis}' AND grup = '${line}'
    AND shift in ('Shift 1','Shift 2') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT id,shift,sku,plan,real,ach,packing_reject,sheet,book,banded,sapuanpack,buble FROM automation.lhp where realdatetime = '${thisyestertime}' AND grup = '${line}'
    AND shift in ('Shift 3') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.post('/lhpl5', async (req, res) => {
    const {
        users_input,
        realdatetime,
        grup,
        shift,
        sku,
        reguler,
        hold,
        output,
        rmd,
        rfeeding,
        rsampleqc,
        rpackinner,
        rmall,
        roll,
        rpackTable,
        rmtotal,
        roven,
        soven,
        mcbks,
        ptable,
        serbuk,
        tampungan,
        total,
        brtpack,
        batch,
        wiinner,
        wipackinner,
        wikulit,
        witotal,
        viawal,
        viambil,
        viakhir,
        vireturn,
        viinner,
        viRainner,
        viall,
        variance,
        krkawal,
        krAwal,
        krakhir,
        krpakai,
        kreturn,
        kreject,
        kendalaall
    } = req.body;
    try {
        // Menggunakan async/await untuk query dan menangani hasil query
        const results = await db.query(`
            INSERT INTO automation.lhp_l5(
              users_input, realdatetime, grup, shift, sku, reguler, hold,output, rmd, rfeeding, 
              rmall, rpacktable, rmtotal, roven, soven, mcbks, ptable, serbuk, tampungan, total, 
              brtpack, batch, wiinner, wipackinner, wikulit, witotal, viawal, viambil, viakhir, vireturn,
              viinner, virainner, viall, variance, krkawal, krawal, krakhir, krpakai, kreturn, kreject,
              kendalaall, rpackinner, roll, rsampleqc
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
                $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
                $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, 
                $41, $42,$43,$44
            ) RETURNING id`, [
                users_input,realdatetime,grup,shift,sku,reguler,hold,output,rmd,rfeeding,
                rmall,rpackTable,rmtotal, roven,soven,mcbks,ptable,serbuk,tampungan,total,
                brtpack,batch,wiinner,wipackinner,wikulit,witotal,viawal,viambil,viakhir,vireturn,
                viinner,viRainner,viall,variance,krkawal,krAwal,krakhir,krpakai,kreturn,kreject,
                kendalaall,rpackinner,roll,rsampleqc
        ]);
        // Mengirim respons berhasil
        res.status(201).json({ id: results.rows[0].id });
    } catch (error) {
        // Menangani error dan mengirim response error
        console.error("Error inserting data:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});
app.get('/lhpl5', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.lhp_l5 ORDER BY id DESC LIMIT 1');
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhpl5/detail/:id', async (req, res) => {
    var id = req.params.id
    const result = await db.query(`SELECT * FROM automation.lhp_l5 where id = '${id}'`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhpl5_daily/:line', async (req, res) => {
    var line = req.params.line
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT * FROM automation.lhp_l5 where realdatetime = '${thisdaytime}' AND grup = '${line}' 
    AND shift in ('Shift 1') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhpl5_daily/date/:date/:line', async (req, res) => {
    var line = req.params.line
    var datethis = req.params.date
    console.log(datethis)
    const result = await db.query(`SELECT * FROM automation.lhp_l5 where realdatetime = '${datethis}' AND grup = '${line}'
    AND shift in ('Shift 1','Shift 2') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db.query(`SELECT * FROM automation.lhp_l5 where realdatetime = '${thisyestertime}' AND grup = '${line}'
    AND shift in ('Shift 3') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.post('/lhpl7', async (req, res) => {
    var { realdatetime, grup, shift, sku, plan, real, ach, cello, cellocpp, ctn_type, cello_used, adonan_used, ccbcream_used, avgsheet, avgbook, sheet, book, cutkasar, bubukcuttig, sapuancut, qcpacking, qccello, packing_reject, pof_kue, sapuanpack, buble, suppliercello, speed_mesin, kendala, sample_ctn_qc, banded_under, banded_over, cutoff_jam, ctn_luar, d_b, plastik_pof, coklat_used, sortir, pof } = req.body;
    db.query('INSERT INTO automation.lhp (realdatetime ,grup, shift, sku ,plan,real,ach,cello,cellocpp,ctn_type,cello_used,adonan_used,ccbcream_used,avgsheet,avgbook,sheet,book,cutkasar,bubukcutting,sapuancut,qcpacking,qccello,packing_reject,pof_kue,sapuanpack,buble,suppliercello,speed_mesin,kendala,sample_ctn_qc,banded_under,banded_over,cutoff_jam,ctn_luar,d_b,plastik_pof,coklat_used,sortir,pof ) VALUES ($1, $2, $3,$4, $5, $6, $7, $8, $9,$10, $11, $12,$13, $14, $15,$16, $17, $18,$19, $20, $21,$22, $23, $24,$25, $26,$27, $28, $29,$30, $31, $32,$33,$34,$35,$36,$37,$38,$39) RETURNING id',
        [realdatetime, grup, shift, sku, plan, real, ach, cello, cellocpp, ctn_type, cello_used, adonan_used, ccbcream_used, avgsheet, avgbook, sheet, book, cutkasar, bubukcuttig, sapuancut, qcpacking, qccello, packing_reject, pof_kue, sapuanpack, buble, suppliercello, speed_mesin, kendala, sample_ctn_qc, banded_under, banded_over, cutoff_jam, ctn_luar, d_b, plastik_pof, coklat_used, sortir, pof], (error, results) => {
            res.status(204).send(" added");
        })
});



app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
