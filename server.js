import express from 'express';
import fs from 'fs';
import logger from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Telegraf } from 'telegraf';
import date from 'date-and-time';
import cron from 'node-cron';
import jwt from 'jsonwebtoken';
import https from 'https';
import db from './config/util.js';
import db_iot from './config/users.js';
import register from './routes/auth/register.js';

// Routes Definisi
import line1 from './routes/wafer/line1/line1.js';
import line2 from './routes/wafer/line2/line2.js';
import line7 from './routes/wafer/line7/line7.js';
import central_kitchen from './routes/central_kitchen.js';

const app = express();
const bot = new Telegraf('6615502786:AAEF5x-f7uB0fUhnuifF3YkWsclzI37k1VM');

const corsOptions = {
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(logger('dev'));
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT ,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.json({ "Welcome": "Selamat Datang di API RESMI KAMI" });
});

function validateUser(req, res, next) {
    jwt.verify(req.headers['x-access-token'], req.app.get('secretKey'), (err, decoded) => {
        if (err) {
            res.json({ status: "error", message: err.message, data: null });
        } else {
            req.body.userId = decoded.id;
            next();
        }
    });
}

app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/login', register);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Definisikan fungsi `format` yang ingin ditambahkan ke `req`
function format(date) {
    if (!(date instanceof Date)) {
        throw new Error('Invalid "date" argument. You must pass a date instance');
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Middleware untuk menambahkan `db`, `db_iot`, dan `format` ke setiap `req`
app.use((req, res, next) => {
    req.db = db;          // Menambahkan koneksi `db` ke request
    req.db_iot = db_iot;  // Menambahkan koneksi `db_iot` ke request
    next();               // Melanjutkan ke middleware atau rute berikutnya
});

app.use('/', central_kitchen);

//line1
app.use('/', line1);
//line2
app.use('/', line2);
//line7
app.use('/', line7);
//PACKING B3
app.use('/', packingB3);
//PACKING B1
app.get('/shift1_b1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('6.46', '7.0', '7.30', '8.0', '8.30', '9.0', '9.30', '10.0', '10.30', '11.0', '11.30', '12.0', '12.30', '13.0', '13.30', '14.0', '14.30', '14.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_b1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('14.46', '15.30', '16.00', '16.30', '17.00', '17.30', '18.00', '18.30', '19.00', '19.30', '20.00', '20.30', '21.00', '21.30', '22.00', '22.30', '22.45') ORDER BY id ASC`);
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
    const resultone = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_b1', async (req, res) => {
    const result = await db_iot.query('SELECT * FROM purwosari.packing_b1 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b1_all', async (req, res) => {
    const result = await db_iot.query(`SELECT * FROM purwosari.packing_b1 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b1_counter', async (req, res) => {
    const result = await db_iot.query('SELECT counter FROM purwosari.packing_b1 ORDER BY id DESC LIMIT 7');
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
    const result = await db_iot.query(`SELECT id , counter ,time, jam FROM purwosari.packing_b1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b1_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_b1 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_b1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b1_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT id ,counter , jam FROM purwosari.packing_b1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db_iot.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM purwosari.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_b1_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_b1 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_b1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
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
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_b1 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
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
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_b1 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING B2
app.get('/shift1_b2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('6.46', '7.0', '7.30', '8.0', '8.30', '9.0', '9.30', '10.0', '10.30', '11.0', '11.30', '12.0', '12.30', '13.0', '13.30', '14.0', '14.30', '14.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_b2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('14.46', '15.30', '16.00', '16.30', '17.00', '17.30', '18.00', '18.30', '19.00', '19.30', '20.00', '20.30', '21.00', '21.30', '22.00', '22.30', '22.45') ORDER BY id ASC`);
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
    const resultone = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_b2', async (req, res) => {
    const result = await db_iot.query('SELECT * FROM purwosari.packing_b2 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b2_all', async (req, res) => {
    const result = await db_iot.query(`SELECT * FROM purwosari.packing_b2 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b2_counter', async (req, res) => {
    const result = await db_iot.query('SELECT counter FROM purwosari.packing_b2 ORDER BY id DESC LIMIT 7');
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
    const result = await db_iot.query(`SELECT id , counter,time , jam FROM purwosari.packing_b2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b2_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_b2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_b2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b2_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT id ,counter , jam FROM purwosari.packing_b2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db_iot.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM purwosari.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_b2_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_b2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_b2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
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
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_b2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
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
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_b2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING B4
app.get('/shift1_b4', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('6.46', '7.0', '7.30', '8.0', '8.30', '9.0', '9.30', '10.0', '10.30', '11.0', '11.30', '12.0', '12.30', '13.0', '13.30', '14.0', '14.30', '14.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_b4', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('14.46', '15.30', '16.00', '16.30', '17.00', '17.30', '18.00', '18.30', '19.00', '19.30', '20.00', '20.30', '21.00', '21.30', '22.00', '22.30', '22.45') ORDER BY id ASC`);
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
    const resultone = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b4 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_b4', async (req, res) => {
    const result = await db_iot.query('SELECT * FROM purwosari.packing_b4 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b4_all', async (req, res) => {
    const result = await db_iot.query(`SELECT * FROM purwosari.packing_b4 where graph = 'Y' ORDER BY id DESC`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b4_counter', async (req, res) => {
    const result = await db_iot.query('SELECT counter FROM purwosari.packing_b4 ORDER BY id DESC LIMIT 7');
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
    const result = await db_iot.query(`SELECT id , counter ,time, jam FROM purwosari.packing_b4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b4_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_b4 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_b4 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b4_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT id ,counter , jam FROM purwosari.packing_b4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db_iot.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM purwosari.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_b4_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_b4 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_b4 where graph = 'Y' AND tanggal = '${thisyestertime}' 
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
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_b4 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
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
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_b4 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING A4
app.get('/shift1_a4', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('6.46', '7.0', '7.30', '8.0', '8.30', '9.0', '9.30', '10.0', '10.30', '11.0', '11.30', '12.0', '12.30', '13.0', '13.30', '14.0', '14.30', '14.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_a4', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('14.46', '15.30', '16.00', '16.30', '17.00', '17.30', '18.00', '18.30', '19.00', '19.30', '20.00', '20.30', '21.00', '21.30', '22.00', '22.30', '22.45') ORDER BY id ASC`);
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
    const resultone = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a4 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_a4', async (req, res) => {
    const result = await db_iot.query('SELECT * FROM purwosari.packing_a4 ORDER BY id DESC LIMIT 1');
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a4_all', async (req, res) => {
    const result = await db_iot.query(`SELECT * FROM purwosari.packing_a4 where graph = 'Y' ORDER BY id DESC`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a4_counter', async (req, res) => {
    const result = await db_iot.query('SELECT counter FROM purwosari.packing_a4 ORDER BY id DESC LIMIT 7');
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
    const result = await db_iot.query(`SELECT id , counter ,time, jam FROM purwosari.packing_a4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a4_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_a4 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_a4 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a4_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT id ,counter , jam FROM purwosari.packing_a4 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db_iot.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM purwosari.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_a4_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_a4 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_a4 where graph = 'Y' AND tanggal = '${thisyestertime}' 
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
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_a4 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
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
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_a4 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//lINE1
//packing A5
app.get('/packing_a5', async (req, res) => {
    const result = await db_iot.query('SELECT * FROM purwosari.packing_a5 ORDER BY id DESC LIMIT 1');
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a5_all', async (req, res) => {
    const result = await db_iot.query(`SELECT * FROM purwosari.packing_a5 where graph = 'Y' ORDER BY id DESC`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a5_counter', async (req, res) => {
    const result = await db_iot.query('SELECT counter FROM purwosari.packing_a5 ORDER BY id DESC LIMIT 7');
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
    const result = await db_iot.query(`SELECT counter, jam FROM purwosari.packing_a5 WHERE graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam IN ('6.46', '7.0', '7.30', '8.0', '8.30', '9.0', '9.30', '10.0', '10.30', '11.0', '11.30', '12.0', '12.30', '13.0', '13.30', '14.0', '14.30', '14.45') ORDER BY id ASC`);
    console.log("DATA", result);
    var datalast = result.rows;
    const uniqueData = Object.values(datalast.reduce((acc, current) => {
        if (!acc[current.jam]) {
            acc[current.jam] = current;
        }
        return acc;
    }, {}));

    res.send(uniqueData);
});

app.get('/shift2_a5', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('14.46', '15.30', '16.00', '16.30', '17.00', '17.30', '18.00', '18.30', '19.00', '19.30', '20.00', '20.30', '21.00', '21.30', '22.00', '22.30', '22.45') ORDER BY id ASC`);
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
    const resultone = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a5 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);
    // }
});
app.get('/packing_a5_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT id , counter ,time, jam FROM purwosari.packing_a5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a5_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_a5 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_a5 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a5_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT id ,counter , jam FROM purwosari.packing_a5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db_iot.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM purwosari.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_a5_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_a5 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_a5 where graph = 'Y' AND tanggal = '${thisyestertime}' 
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
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_a5 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
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
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_a5 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING A1
app.get('/packing_a1', async (req, res) => {
    const result = await db_iot.query('SELECT * FROM purwosari.packing_a1 ORDER BY id DESC LIMIT 1');
    // console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a1_all', async (req, res) => {
    const result = await db_iot.query(`SELECT * FROM purwosari.packing_a1 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a1_counter', async (req, res) => {
    const result = await db_iot.query('SELECT counter FROM purwosari.packing_a1 ORDER BY id DESC LIMIT 7');
    // console.log("DATA", result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/shift1_a1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('6.46', '7.0', '7.30', '8.0', '8.30', '9.0', '9.30', '10.0', '10.30', '11.0', '11.30', '12.0', '12.30', '13.0', '13.30', '14.0', '14.30', '14.45') ORDER BY id ASC`);
    console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_a1', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('14.46', '15.30', '16.00', '16.30', '17.00', '17.30', '18.00', '18.30', '19.00', '19.30', '20.00', '20.30', '21.00', '21.30', '22.00', '22.30', '22.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
    // }
});
app.get('/shift3_a1', async (req, res) => {
    var thisdaytime = format(new Date());
    // console.log(thisdaytime)
    var thisdate = new Date();
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resultone = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '22.46' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.45') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_a1_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT id , counter,time, jam FROM purwosari.packing_a1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a1_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    // console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter,time, jam FROM purwosari.packing_a1 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter,time, jam FROM purwosari.packing_a1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a1_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT id ,counter , jam FROM purwosari.packing_a1 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db_iot.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM purwosari.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_a1_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    // console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_a1 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_a1 where graph = 'Y' AND tanggal = '${thisyestertime}' 
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
    // console.log("Real Star Date", startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    // console.log("Real End Date", enddate)
    // console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_a1 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
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
    // console.log("Real Star Date", startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    // console.log("Real End Date", enddate)
    // console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_a1 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
//PACKING A2
app.get('/packing_a2', async (req, res) => {
    const result = await db_iot.query('SELECT * FROM purwosari.packing_a2 ORDER BY id DESC LIMIT 1');
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a2_all', async (req, res) => {
    const result = await db_iot.query(`SELECT * FROM purwosari.packing_a2 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a2_counter', async (req, res) => {
    const result = await db_iot.query('SELECT counter FROM purwosari.packing_a2 ORDER BY id DESC LIMIT 7');
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
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('6.46', '7.0', '7.30', '8.0', '8.30', '9.0', '9.30', '10.0', '10.30', '11.0', '11.30', '12.0', '12.30', '13.0', '13.30', '14.0', '14.30', '14.44') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_a2', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
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
    const resultone = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '22.45' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.45') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_a2_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT id , counter,time , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_a2_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    // console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter,time , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_a2_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT id ,counter , jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db_iot.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM purwosari.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_a2_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    // console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_a2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
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
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_a2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
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
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_a2 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
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
        AND jam in ('6.46','7.31','8.0','8.31','9.0','9.31','10.0','10.31','11.0','11.31','12.0','12.31','13.0','13.31','14.0','14.31','14.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_a3', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT counter , jam FROM automation.packing_a3 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('14.46', '15.30', '16.00', '16.30', '17.00', '17.30', '18.00', '18.30', '19.00', '19.30', '20.00', '20.30', '21.00', '21.30', '22.00', '22.30', '22.45') ORDER BY id ASC`);
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
    const result = await db_iot.query('SELECT * FROM purwosari.packing_b5 ORDER BY id DESC LIMIT 1');
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b5_all', async (req, res) => {
    const result = await db_iot.query(`SELECT * FROM purwosari.packing_b5 where graph = 'Y' ORDER BY id DESC`);
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b5_counter', async (req, res) => {
    const result = await db_iot.query('SELECT counter FROM purwosari.packing_b5 ORDER BY id DESC LIMIT 7');
    // console.log("DATA", result)
    var datalast = result.rows;
    let arr = [];
    for (let index = 0; index < datalast.length; index++) {
        arr.push(datalast[index].counter)
    }
    res.send(arr);
});
app.get('/shift1_b5', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('6.46', '7.0', '7.30', '8.0', '8.30', '9.0', '9.30', '10.0', '10.30', '11.0', '11.30', '12.0', '12.30', '13.0', '13.30', '14.0', '14.30', '14.45') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/shift2_b5', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
        AND jam in ('14.46', '15.30', '16.00', '16.30', '17.00', '17.30', '18.00', '18.30', '19.00', '19.30', '20.00', '20.30', '21.00', '21.30', '22.00', '22.30', '22.45') ORDER BY id ASC`);
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
    const resultone = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam = '23.0' ORDER BY id ASC`);
    var datalastone = resultone.rows;
    let element = {};
    var cart = [];
    for (let index = 0; index < datalastone.length; index++) {
        element.jam = "0." + 23
        element.counter = datalastone[index].counter
        cart.push(element)
    }
    const resulttwo = await db_iot.query(`SELECT counter , jam FROM purwosari.packing_b5 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('0.30', '1.0','1.31','2.0','2.31','3.0','3.31','4.0','4.31','5.0','5.31','6.0','6.31','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = cart.concat(datalasttwo)
    res.send(twoarray);

    // }
});
app.get('/packing_b5_hourly', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT id , counter ,time, jam FROM purwosari.packing_b5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/packing_b5_hourly/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter,time , jam FROM purwosari.packing_b5 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('8.0','9.0','10.0','11.0','12.0','13.0','14.0','14.58','16.0','17.0','18.0','19.0','20.0','21.0','22.0','22.58','23.58') ORDER BY id ASC`);
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter ,time, jam FROM purwosari.packing_b5 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    var datalasttwo = resulttwo.rows;
    var twoarray = datalast.concat(datalasttwo)
    res.send(twoarray);
});
app.get('/packing_b5_daily', async (req, res) => {
    var thisdaytime = format(new Date());
    const result = await db_iot.query(`SELECT id ,counter , jam FROM purwosari.packing_b5 where graph = 'Y' AND tanggal = '${thisdaytime}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db_iot.query(`SELECT id ,cntr_bandet, cntr_carton , jam FROM purwosari.packing_l2 where graph = 'Y' AND tanggal = '${thisyestertime}' 
    // AND jam in ('1.0','2.0','3.0','4.0','5.0','6.0','6.59') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.get('/packing_b5_daily/date/:date', async (req, res) => {
    var datethis = req.params.date
    console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_b5 where graph = 'Y' AND tanggal = '${datethis}' 
    AND jam in ('14.58','22.58') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    var thisdate = new Date(datethis);
    thisdate.setDate(thisdate.getDate() + 1)
    var thisyestertime = format(thisdate)
    const resulttwo = await db_iot.query(`SELECT id ,counter, jam FROM purwosari.packing_b5 where graph = 'Y' AND tanggal = '${thisyestertime}' 
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
    // console.log("Real Star Date", startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    // console.log("Real End Date", enddate)
    // console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_b5 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
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
    // console.log("Real Star Date", startdate)
    var endweekdate = new Date(dates[6]);
    var enddate = format(endweekdate)
    // console.log("Real End Date", enddate)
    // console.log(datethis)
    const result = await db_iot.query(`SELECT id ,counter , jam , realdatetime  FROM purwosari.packing_b5 where graph = 'Y' AND tanggal BETWEEN '${startdate}' AND '${enddate}'
    AND jam in ('14.58','22.58','6.59') ORDER BY id ASC`);
    var datalast = result.rows;
    res.send(datalast);
});
app.post('/lhp', async (req, res) => {
    const {
        realdatetime,
        grup,
        shift,
        sku,
        plan,
        real,
        ach,
        cello,
        cellocpp,
        ctn_type,
        cello_used,
        adonan_used,
        ccbcream_used,
        avgsheet,
        avgbook,
        sheet,
        book,
        cutkasar,
        bubukcutting,
        sapuancut,
        qcpacking,
        qccello,
        packing_reject,
        banded,
        sapuanpack,
        buble,
        suppliercello,
        speed_mesin,
        sample_ctn_qc,
        banded_under,
        banded_over,
        cutoff_jam,
        ctn_luar,
        d_b,
        plastik_pof,
        coklat_used,
        sortir,
        pof_kue,
        users_input,
        downtime // Tambahkan downtime ke dalam request body
    } = req.body;

    try {
        // Step 1: Insert data LHP ke dalam database
        const result = await db.query(
            `INSERT INTO automation.lhp (
                realdatetime,
                grup,
                shift,
                sku,
                plan,
                real,
                ach,
                cello,
                cellocpp,
                ctn_type,
                cello_used,
                adonan_used,
                ccbcream_used,
                avgsheet,
                avgbook,
                sheet,
                book,
                cutkasar,
                bubukcutting,
                sapuancut,
                qcpacking,
                qccello,
                packing_reject,
                banded,
                sapuanpack,
                buble,
                suppliercello,
                speed_mesin,
                sample_ctn_qc,
                banded_under,
                banded_over,
                cutoff_jam,
                ctn_luar,
                d_b,
                plastik_pof,
                coklat_used,
                sortir,
                pof_kue,
                users_input
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $22, $23, $24, $25,
                $26, $27, $28, $29, $30, $31, $32, $33,
                $34, $35, $36, $37, $38, $39
            ) RETURNING id`,
            [
                realdatetime, grup, shift, sku, plan, real, ach, cello, cellocpp, ctn_type,
                cello_used, adonan_used, ccbcream_used, avgsheet, avgbook, sheet, book,
                cutkasar, bubukcutting, sapuancut, qcpacking, qccello, packing_reject,
                banded, sapuanpack, buble, suppliercello, speed_mesin,
                sample_ctn_qc, banded_under, banded_over, cutoff_jam, ctn_luar,
                d_b, plastik_pof, coklat_used, sortir, pof_kue, users_input
            ]
        );

        const idLhp = result.rows[0].id;
        // Step 2: Prepare kendala as JSONB from downtime
        const kendalaDowntime = {};
        downtime.forEach((entry, index) => {
            kendalaDowntime[`kendala${index + 1}`] = `Time Start: ${entry.time_start}, Time Stop: ${entry.time_stop}, Total DT: ${entry.total_dt}, Kendala: ${entry.kendala}, Unit Mesin: ${entry.unit_mesin} , Part Mesin: ${entry.part_mesin}`;
        });

        // Step 3: Update kendala di tabel LHP dengan JSONB
        await db.query(
            `UPDATE automation.lhp
                 SET kendala = $1
                 WHERE id = $2`,
            [JSON.stringify(kendalaDowntime), idLhp] // Konversi ke JSON string sebelum menyimpan
        );

        // Step 4: Insert data downtime ke dalam tabel downtime, kaitkan dengan id_lhp
        const downtimeInsertPromises = downtime.map(entry => {
            return db.query(
                `INSERT INTO automation.downtime (
                    id_lhp,
                    time_start,
                    time_stop,
                    total_dt,
                    kendala,
                    unit_mesin,
                    part_mesin
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    idLhp, // ID LHP yang terhubung dengan downtime
                    entry.time_start,
                    entry.time_stop,
                    entry.total_dt,
                    entry.kendala,
                    entry.unit_mesin,
                    entry.part_mesin
                ]
            );
        });

        // Tunggu semua downtime di-insert
        await Promise.all(downtimeInsertPromises);

        res.status(201).json({ id: idLhp });
    } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).json({ error: 'An error occurred while saving data.' });
    }
});
app.get('/lhp', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.lhp ORDER BY id DESC LIMIT 1');
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhp/detail/:id', async (req, res) => {
    var id = req.params.id
    const result = await db.query(`SELECT * FROM automation.lhp where id = '${id}'`);
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhp_daily/:line', async (req, res) => {
    var line = req.params.line
    var thisdaytime = format(new Date());
    const result = await db.query(`SELECT * FROM automation.lhp where realdatetime = '${thisdaytime}' AND grup = '${line}' 
    AND shift in ('Shift 1') ORDER BY id ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhp_daily/date/:date/:line', async (req, res) => {
    var line = req.params.line
    var datethis = req.params.date
    // console.log(datethis)
    const result = await db.query(`SELECT * FROM automation.lhp where realdatetime = '${datethis}' AND grup = '${line}'
    AND shift in ('Shift 1','Shift 2', 'Shift 3') ORDER BY shift ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/downtime_daily/range/:startDate/:endDate/:line', async (req, res) => {
    try {
        const { startDate, endDate, line } = req.params; // Destrukturisasi params dengan benar

        // Query untuk join tabel lhp dan downtime dengan rentang tanggal
        const query = `
            SELECT 
                downtime.id AS downtime_id,
                downtime.time_start, 
                downtime.time_stop, 
                downtime.total_dt, 
                downtime.kendala,
                downtime.unit_mesin,
                downtime.part_mesin,
                lhp.grup, 
                lhp.users_input, 
                TO_CHAR(lhp.realdatetime, 'YYYY-MM-DD') AS realdatetime
            FROM 
                automation.downtime
            JOIN 
                automation.lhp
            ON 
                downtime.id_lhp::integer = lhp.id
            WHERE 
                lhp.realdatetime BETWEEN $1 AND $2  -- Filter berdasarkan rentang tanggal
                AND lhp.grup = $3                 -- Filter berdasarkan grup
            ORDER BY 
                downtime.id ASC
        `;

        // Menggunakan parameterized query untuk menghindari SQL injection
        const result = await db.query(query, [startDate, endDate, line]); // Parameter dipisahkan dari query

        // Mengirimkan hasil query sebagai response
        res.send(result.rows);
    } catch (error) {
        console.error("Error fetching downtime data:", error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/downtime_daily_l5/range/:startDate/:endDate/:line', async (req, res) => {
    try {
        const { startDate, endDate, line } = req.params; // Destrukturisasi params dengan benar

        // Query untuk join tabel lhp dan downtime dengan rentang tanggal
        const query = `
            SELECT 
                downtime_l5.id AS downtime_id,
                downtime_l5.time_start, 
                downtime_l5.time_stop, 
                downtime_l5.total_dt, 
                downtime_l5.kendala,
                downtime_l5.unit_mesin,
                downtime_l5.part_mesin,
                lhp_l5.grup, 
                lhp_l5.users_input, 
                TO_CHAR(lhp_l5.realdatetime, 'YYYY-MM-DD') AS realdatetime
            FROM 
                automation.downtime_l5
            JOIN 
                automation.lhp_l5
            ON 
                downtime_l5.id_lhp::integer = lhp_l5.id
            WHERE 
                lhp_l5.realdatetime BETWEEN $1 AND $2  -- Filter berdasarkan rentang tanggal
                AND lhp_l5.grup = $3                 -- Filter berdasarkan grup
            ORDER BY 
                downtime_l5.id ASC
        `;

        // Menggunakan parameterized query untuk menghindari SQL injection
        const result = await db.query(query, [startDate, endDate, line]); // Parameter dipisahkan dari query

        // Mengirimkan hasil query sebagai response
        res.send(result.rows);
    } catch (error) {
        console.error("Error fetching downtime data:", error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/lhpl5', async (req, res) => {
    const {
        users_input, realdatetime, grup, shift, sku, reguler, planning, hold, output, output_kg,
        batch_buat, variance_batch, variance_fg, bubuk, beratKering, beratBasah, rmd, rfeeding, sampahpacking, rpackinner,
        rmall, roll, rpackTable, rejectpacking, rejectstacking, rejectcoolingconveyor, rmtotal, roven, soven, mcbks, ptable, serbuk, tampungan,
        total, brtpack, brtpcs, wiinner, wipkulitawal, wipkulitakhir, wipselisih, wipkulit, viawal, viambil, viakhir,
        vireturn, viinner, viRainner, viall, variance, krkawal, krAwal, krakhir, krpakai, kreturn,
        kreject, kendalaall, downtime, batch_tuang, batch_cetak, wip_adonan_awal, wip_adonan_akhir, wip_adonan_selisih, wip_adonan_kulit, adonan_gagal_kg,
        adonan_gagal_kulit, weight_bsc_pcs, weight_bsc_pack,
    } = req.body;

    try {
        if (!users_input || !realdatetime || !grup || !shift || !sku) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Step 1: Insert data LHP L5 ke dalam database
        const result = await db.query(
            `INSERT INTO automation.lhp_l5 (
                users_input, realdatetime, grup, shift, sku, reguler, hold, output, bubuk,
                berat_kering, berat_basah, rmd, rfeeding, 
                rmall, rpacktable, rejectpacking, rejectstacking, rejectcoolingconveyor,rmtotal, roven, soven, mcbks, ptable, serbuk, tampungan, total, 
                brtpack, brtpcs, wiinner, wipkulitawal, wipkulitakhir, wipselisih,wipkulit, viawal, viambil, viakhir, vireturn,
                viinner, virainner, viall, variance, krkawal, krawal, krakhir, krpakai, kreturn, kreject,
                kendalaall, rpackinner, roll, sampahpacking, planning, output_kg, batch_buat, variance_batch, variance_fg,
                batch_tuang, batch_cetak, wip_adonan_awal, wip_adonan_akhir, wip_adonan_selisih,
                wip_adonan_kulit, adonan_gagal_kg, adonan_gagal_kulit, weight_bsc_pcs, weight_bsc_pack
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
                $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
                $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, 
                $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
                $51, $52, $53, $54, $55, $56, $57, $58, $59, $60,
                $61, $62, $63, $64, $65, $66
            ) RETURNING id`,
            [
                users_input, realdatetime, grup, shift, sku, reguler, hold, output, bubuk,
                beratKering, beratBasah, rmd, rfeeding,
                rmall, rpackTable, rejectpacking, rejectstacking, rejectcoolingconveyor, rmtotal, roven, soven, mcbks, ptable, serbuk, tampungan, total,
                brtpack, brtpcs, wiinner, wipkulitawal, wipkulitakhir, wipselisih, wipkulit, viawal, viambil, viakhir, vireturn,
                viinner, viRainner, viall, variance, krkawal, krAwal, krakhir, krpakai, kreturn, kreject,
                kendalaall, rpackinner, roll, sampahpacking, planning, output_kg, batch_buat, variance_batch,
                variance_fg,
                batch_tuang, batch_cetak, wip_adonan_awal, wip_adonan_akhir, wip_adonan_selisih,
                wip_adonan_kulit, adonan_gagal_kg, adonan_gagal_kulit, weight_bsc_pcs, weight_bsc_pack
            ]
        );

        if (result.rows.length === 0) {
            throw new Error("Failed to insert data into LHP L5");
        }

        const idLhpL5 = result.rows[0].id;

        // Step 2: Prepare kendala as JSONB from downtime
        const kendalaDowntime = {};
        downtime.forEach((entry, index) => {
            kendalaDowntime[`kendala${index + 1}`] = `Time Start: ${entry.time_start}, Time Stop: ${entry.time_stop}, Total DT: ${entry.total_dt}, Kendala: ${entry.kendala}, Unit Mesin: ${entry.unit_mesin} , Part Mesin: ${entry.part_mesin}`;
        });

        // Step 3: Update kendala di tabel LHP dengan JSONB
        await db.query(
            `UPDATE automation.lhp_l5
               SET kendalaall = $1
               WHERE id = $2`,
            [JSON.stringify(kendalaDowntime), idLhpL5]
            // Konversi ke JSON string sebelum menyimpan
        );

        // Step 4: Insert data downtime ke dalam tabel downtime, kaitkan dengan id_lhp
        const downtimeInsertPromises = downtime.map(entry => {
            return db.query(
                `INSERT INTO automation.downtime_l5 (
                  id_lhp,
                  time_start,
                  time_stop,
                  total_dt,
                  kendala,
                  unit_mesin,
                  part_mesin
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    idLhpL5, // ID LHP yang terhubung dengan downtime
                    entry.time_start,
                    entry.time_stop,
                    entry.total_dt,
                    entry.kendala,
                    entry.unit_mesin,
                    entry.part_mesin
                ]
            );
        });

        // Tunggu semua downtime di-insert
        await Promise.all(downtimeInsertPromises);

        res.status(201).json({ id: idLhpL5 });
    } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});
app.get('/lhpl5', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.lhp_l5 ORDER BY id DESC LIMIT 1');
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.get('/lhpl5/detail/:id', async (req, res) => {
    var id = req.params.id
    const result = await db.query(`SELECT * FROM automation.lhp_l5 where id = '${id}'`);
    // console.log("DATA", result)
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
    // console.log(datethis)
    const result = await db.query(`SELECT * FROM automation.lhp_l5 where realdatetime = '${datethis}' AND grup = '${line}'
    AND shift in ('Shift 1','Shift 2','Shift 3') ORDER BY shift ASC`);
    //console.log("DATA" ,result)
    var datalast = result.rows;
    // var thisdate = new Date(datethis);
    // thisdate.setDate(thisdate.getDate() + 1)
    // var thisyestertime = format(thisdate)
    // const resulttwo = await db.query(`SELECT * FROM automation.lhp_l5 where realdatetime = '${thisyestertime}' AND grup = '${line}'
    // AND shift in ('Shift 3') ORDER BY id ASC`);
    // var datalasttwo = resulttwo.rows;
    // var twoarray = datalast.concat(datalasttwo)
    res.send(datalast);
});
app.post('/lhpl7', async (req, res) => {
    const {
        realdatetime,
        grup,
        shift,
        sku,
        plan,
        real,
        ach,
        cello,
        cellocpp,
        ctn_type,
        cello_used,
        adonan_used,
        ccbcream_used,
        avgsheet,
        avgbook,
        sheet,
        book,
        cutkasar,
        bubukcutting,
        sapuancut,
        qcpacking,
        qccello,
        packing_reject,
        pof_kue,
        sapuanpack,
        buble,
        suppliercello,
        speed_mesin,
        sample_ctn_qc,
        banded_under,
        banded_over,
        cutoff_jam,
        ctn_luar,
        d_b,
        plastik_pof,
        coklat_used,
        sortir,
        pof,
        users_input,
        downtime // Menambahkan downtime ke dalam request body
    } = req.body;

    try {
        // Step 1: Insert data LHP ke dalam database
        const result = await db.query(
            `INSERT INTO automation.lhp (
                realdatetime,
                grup,
                shift,
                sku,
                plan,
                real,
                ach,
                cello,
                cellocpp,
                ctn_type,
                cello_used,
                adonan_used,
                ccbcream_used,
                avgsheet,
                avgbook,
                sheet,
                book,
                cutkasar,
                bubukcutting,
                sapuancut,
                qcpacking,
                qccello,
                packing_reject,
                pof_kue,
                sapuanpack,
                buble,
                suppliercello,
                speed_mesin,
                sample_ctn_qc,
                banded_under,
                banded_over,
                cutoff_jam,
                ctn_luar,
                d_b,
                plastik_pof,
                coklat_used,
                sortir,
                pof,
                users_input
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $22, $23, $24, $25,
                $26, $27, $28, $29, $30, $31, $32, $33,
                $34, $35, $36, $37, $38, $39
            ) RETURNING id`,
            [
                realdatetime, grup, shift, sku, plan, real, ach, cello, cellocpp, ctn_type,
                cello_used, adonan_used, ccbcream_used, avgsheet, avgbook, sheet, book,
                cutkasar, bubukcutting, sapuancut, qcpacking, qccello, packing_reject,
                pof_kue, sapuanpack, buble, suppliercello, speed_mesin,
                sample_ctn_qc, banded_under, banded_over, cutoff_jam, ctn_luar,
                d_b, plastik_pof, coklat_used, sortir, pof, users_input
            ]
        );

        const idLhp = result.rows[0].id;

        // Step 2: Prepare kendala as JSONB from downtime
        const kendalaDowntime = {};
        downtime.forEach((entry, index) => {
            kendalaDowntime[`kendala${index + 1}`] = `Time Start: ${entry.time_start}, Time Stop: ${entry.time_stop}, Total DT: ${entry.total_dt}, Kendala: ${entry.kendala}, Unit Mesin: ${entry.unit_mesin} , Part Mesin: ${entry.part_mesin}`;
        });

        // Step 3: Update kendala di tabel LHP dengan JSONB
        await db.query(
            `UPDATE automation.lhp
                 SET kendala = $1
                 WHERE id = $2`,
            [JSON.stringify(kendalaDowntime), idLhp]
            // Konversi ke JSON string sebelum menyimpan
        );

        // Step 4: Insert data downtime ke dalam tabel downtime, kaitkan dengan id_lhp
        const downtimeInsertPromises = downtime.map(entry => {
            return db.query(
                `INSERT INTO automation.downtime (
                    id_lhp,
                    time_start,
                    time_stop,
                    total_dt,
                    kendala,
                    unit_mesin,
                    part_mesin
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    idLhp, // ID LHP yang terhubung dengan downtime
                    entry.time_start,
                    entry.time_stop,
                    entry.total_dt,
                    entry.kendala,
                    entry.unit_mesin,
                    entry.part_mesin
                ]
            );
        });

        // Tunggu semua downtime di-insert
        await Promise.all(downtimeInsertPromises);

        res.status(201).json({ id: idLhp });
    } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).json({ error: 'An error occurred while saving data.' });
    }
});
app.get('/downtime_l1', async (req, res) => {
    const result = await db.query('SELECT * FROM automation.donwtime ORDER BY id DESC LIMIT 1');
    // console.log("DATA", result)
    var datalast = result.rows;
    res.send(datalast);
});
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});