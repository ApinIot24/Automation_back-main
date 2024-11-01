import express from 'express';
import fs from 'fs';
import logger from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import date from 'date-and-time';
import cron from 'node-cron';
import jwt from 'jsonwebtoken';
import https from 'https';
import db from './config/util.js';
import db_iot from './config/users.js';
import register from './routes/auth/register.js';
import { Bot } from 'grammy';

// Routes Definisi Wafer
import downtime_wafer from './routes/wafer/downtime/downtime.js';
import lhp_wafer from './routes/wafer/lhp/lhp.js';
import control_wafer from './routes/wafer/lhp/control.js';
import line1 from './routes/wafer/line1/line1.js';
import line2 from './routes/wafer/line2/line2.js';
import line7 from './routes/wafer/line7/line7.js';
// Routes Definisi Biscuit
// import line5 from './routes/biscuit/line5/line5.js';
import downtime_biscuit from './routes/biscuit/downtime/downtime.js';
import lhp_biscuit from './routes/biscuit/lhp/lhp.js';

import central_kitchen from './routes/central_kitchen.js';

const app = express();
const bot = new Bot('7619267734:AAEQ5PznHdgJRuLDWCm_VWv8mp-k4SzjSbI');

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
// downtime_wafer
app.use('/', downtime_wafer);
// lhp_wafer
app.use('/', lhp_wafer);
app.use('/', control_wafer);
// line5
// app.use('/',line5);
// downtime_biscuit
app.use('/', downtime_biscuit);
// lhp_biscuit
app.use('/', lhp_biscuit);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});