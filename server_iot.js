import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import http from 'http';  // Gunakan http untuk server
import https from 'https'; 
import cron from 'node-cron';
import { Server } from 'socket.io';
import db from './config/util.js';
import db_iot from './config/users.js';
import register from './routes/auth/register.js';
import { Bot } from 'grammy';
import fs from 'fs';
// Routes Definisi Wafer
import downtime_wafer from './routes/wafer/downtime/downtime.js';
import lhp_wafer from './routes/wafer/lhp/lhp.js';
import control_wafer from './routes/wafer/lhp/control.js';
import line1 from './routes/wafer/line1/line1.js';
import line2 from './routes/wafer/line2/line2.js';
import line6 from './routes/wafer/line6/line6.js';
import line7 from './routes/wafer/line7/line7.js';
// Routes Definisi Biscuit
import line5 from './routes/biscuit/line5/line5.js';
import downtime_biscuit from './routes/biscuit/downtime/downtime.js';
import lhp_biscuit from './routes/biscuit/lhp/lhp.js';
import central_kitchen from './routes/central_kitchen.js';
import importRoutesWafer from './routes/wafer/import/import.js';

const app = express();



// Membuat server HTTP
const httpServer = http.createServer(app);

// Inisialisasi Socket.IO pada server HTTP
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Sesuaikan jika Anda ingin membatasi domain yang dapat mengakses
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

// Middleware
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

// Middleware untuk autentikasi
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
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware untuk menambahkan `db` ke `req`
app.use((req, res, next) => {
    req.db = db;
    req.db_iot = db_iot;
    next();
});

// Inisialisasi Socket.IO
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Event saat klien terputus
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Cron job untuk mengirim notifikasi setiap menit
cron.schedule('* * * * *', () => {
    const payload = {
        title: 'Notifikasi Terjadwal',
        body: 'Ini adalah notifikasi yang dikirim setiap menit.',
    };
    io.emit('notification', payload); // Kirim notifikasi ke semua klien
    console.log('Notifikasi dikirim:', payload);
});

// API Routes
app.use('/', central_kitchen);
app.use('/', line1);
app.use('/', line2);
app.use('/', line6);
app.use('/', line7);
app.use('/', downtime_wafer);
app.use('/', lhp_wafer);
app.use('/', control_wafer);
app.use('/', line5);
app.use('/', downtime_biscuit);
app.use('/', lhp_biscuit);
app.use('/api', importRoutesWafer);


// Membaca file sertifikat SSL
const privateKey = fs.readFileSync('./server.key', 'utf8');
const certificate = fs.readFileSync('./server.cert', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// app.use((req, res, next) => {
//     if (req.secure) {
//         return next();
//     }
//     res.redirect(`https://${req.headers.host}${req.url}`);
// });

// Membuat server HTTPS
const httpsServer = https.createServer(credentials, app);
// Jalankan server HTTP
httpServer.listen(3000, '10.37.12.17', () => {
    console.log('Server HTTP berjalan di https://10.37.12.17:3000');
});

// Jalankan server HTTPS
httpsServer.listen(3443, '10.37.12.17', () => {
    console.log('Server HTTPS berjalan di https://10.37.12.17:3443');
});