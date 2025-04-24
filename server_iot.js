import express from "express";
import logger from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import http from "http";
import https from "https";
import cron from "node-cron";
import { Server } from "socket.io";
import db from "./config/util.js";
import db_iot from "./config/users.js";
import { Bot } from "grammy";
import fs from "fs";
import dotenv from "dotenv";

// import register from "./routes/auth/register.js";
// Routes Definisi
import downtime_wafer from "./routes/wafer/downtime/downtime.js";
import lhp_wafer from "./routes/wafer/lhp/lhp.js";
import control_wafer from "./routes/wafer/lhp/control.js";
import line1 from "./routes/wafer/line1/line1.js";
import line2 from "./routes/wafer/line2/line2.js";
import line6 from "./routes/wafer/line6/line6.js";
import line7 from "./routes/wafer/line7/line7.js";
import line5 from "./routes/biscuit/line5/line5.js";
import downtime_biscuit from "./routes/biscuit/downtime/downtime.js";
import lhp_biscuit from "./routes/biscuit/lhp/lhp.js";
import central_kitchen from "./routes/central_kitchen.js";
import importRoutesWafer from "./routes/wafer/pm/import.js";
import importRoutesBiscuit from "./routes/biscuit/import/import.js";
import utility from "./routes/utility/utility.js";

// checklist
import qrchecklist from "./routes/checklist.js";
// users
import authRoutes from "./routes/auth/authRoutes.js";
import roleRoutes from "./routes/settings/roleRoutes.js";
import users from "./routes/users/userRoutes.js";
// Load environment variables
dotenv.config();

const app = express();
const httpPort = process.env.HTTP_PORT;
const httpsPort = process.env.HTTPS_PORT;
const localHttpPort = process.env.LOCAL_HTTP_PORT;
const ipAddress = process.env.IP_ADDRESS;
const secretKey = process.env.SECRET_KEY;

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

app.use(logger("dev"));
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Autentikasi Middleware
function validateUser(req, res, next) {
  jwt.verify(req.headers["x-access-token"], secretKey, (err, decoded) => {
    if (err) {
      res.json({ status: "error", message: err.message, data: null });
    } else {
      req.body.userId = decoded.id;
      next();
    }
  });
}

app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
// app.use("/login", register);
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Menambahkan `db` ke `req`
app.use((req, res, next) => {
  req.db = db;
  req.db_iot = db_iot;
  next();
});

// Membuat server HTTP dan HTTPS
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Socket.IO
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Cron job
// cron.schedule('* * * * *', () => {
//     const payload = { title: 'Notifikasi Terjadwal', body: 'Ini adalah notifikasi setiap menit.' };
//     io.emit('notification', payload);
//     console.log('Notifikasi dikirim:', payload);
// });

// Routes
app.use("/", central_kitchen);
app.use("/", line1);
app.use("/", line2);
app.use("/", line6);
app.use("/", line7);
app.use("/", downtime_wafer);
app.use("/", lhp_wafer);
app.use("/", control_wafer);
app.use("/", line5);
app.use("/", downtime_biscuit);
app.use("/", lhp_biscuit);
app.use("/api", utility);
app.use("/api", importRoutesWafer);
app.use("/api", importRoutesBiscuit);
app.use("/api", qrchecklist);

app.use("/api/auth", authRoutes);
app.use("/api", users);
app.use("/api/setting", roleRoutes);



app.get('/test', async (req, res) => {
  try {

  } catch (error) {
    console.error("Error fetching downtime data:", error);
    res.status(500).send('Internal Server Error');
  }
  });


  
// Membaca sertifikat SSL
const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, "utf8");
const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, "utf8");
const credentials = { key: privateKey, cert: certificate };

const httpsServer = https.createServer(credentials, app);

// Jalankan server
httpServer.listen(httpPort, ipAddress, () => {
  console.log(`Server HTTP berjalan di http://${ipAddress}:${httpPort}`);
});

httpsServer.listen(httpsPort, ipAddress, () => {
  console.log(`Server HTTPS berjalan di https://${ipAddress}:${httpsPort}`);
});

const localHttpServer = http.createServer(app);
localHttpServer.listen(localHttpPort, "localhost", () => {
  console.log(
    `Server HTTP lokal berjalan di http://localhost:${localHttpPort}`
  );
});
