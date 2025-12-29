import express from "express";
import logger from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import http from "http";
import https from "https";
import "./jobs/pmWeekly.cron.js"
import { WebSocketServer } from "ws";
import db from "./config/util.js";
import db_iot from "./config/users.js";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Routes Definitions
import downtime_wafer from "./routes/wafer/downtime/downtime.js";
import lhp_wafer from "./routes/wafer/lhp/lhp.js";
import control_wafer from "./routes/wafer/lhp/control.js";
import line1 from "./routes/wafer/line1/line1.js";
import line2 from "./routes/wafer/line2/line2.js";
import line6 from "./routes/wafer/line6/line6.js";
import line7 from "./routes/wafer/line7/line7.js";
import line5 from "./routes/biscuit/line5/line5.js";
import line2a from "./routes/biscuit/lhp/lhp_2a.js";
import line2b from "./routes/biscuit/line2/line2.js"
import downtime_biscuit from "./routes/biscuit/downtime/downtime.js";
import lhp_biscuit from "./routes/biscuit/lhp/lhp.js";
import central_kitchen from "./routes/central_kitchen.js";
import importRoutesWafer from "./routes/wafer/pm/import.js";
import importRoutesBiscuit from "./routes/biscuit/import/import.js";
import importRoutesAstor from "./routes/astor/import/import.js";
import importRoutesUtility from "./routes/utility/import/import.js";
import utility from "./routes/utility/utility.js";
// CK
import biscuitck3 from "./routes/biscuit/line5/Biscuitck3.js";
import biscuitck3v2 from "./routes/biscuit/line5/Biscuitck3v2.js";
import Biscuitpompack3 from "./routes/biscuit/line5/Biscuitpompack3.js";
import Biscuitagitatorck3 from "./routes/biscuit/line5/Biscuitagitatorck3.js";
import Biscuitckmalkist from "./routes/biscuit/line5/Biscuitckmalkist.js";

// checklist
import qrchecklist from "./routes/checklist.js";
// users
import authRoutes from "./routes/auth/authRoutes.js";
import roleRoutes from "./routes/settings/roleRoutes.js";
import users from "./routes/users/userRoutes.js";
import formtiket from "./routes/ticket.js";

// setting_pm
import settingpm from "./routes/setting_pm/index.js";
// replacement_pm
import replacementpm from "./routes/pm_replacement.js";
// pm weekly test
import pmWeeklyTest from "./routes/pmWeeklyTest.js";
import gdspMaster from "./routes/gdsp/master_gdsp.js"
import gdspUser from "./routes/gdsp/master_user.js"
import gdspMasterData from "./routes/gdsp/master_data.js"
// gas meter
import gasmeter from "./routes/utility/gasmeter/gasmeter.js";
// sync_database
import syncDatabase, { transferDataCron } from "./sync_database/syncdatabase.js";

const app = express();
const httpPort = process.env.HTTP_PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3443;
const localHttpPort = process.env.LOCAL_HTTP_PORT || 8080;
const ipAddress = process.env.IP_ADDRESS || "0.0.0.0";
const secretKey =
  process.env.SECRET_KEY || "default_secret_key_for_development";

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "x-access-token",
  ],
};

app.use(logger("dev"));
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Authentication Middleware
function validateUser(req, res, next) {
  const token = req.headers["x-access-token"];

  if (!token) {
    return res
      .status(401)
      .json({ status: "error", message: "No token provided", data: null });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ status: "error", message: err.message, data: null });
    } else {
      req.body.userId = decoded.id;
      next();
    }
  });
}

// Attach database connections to request object
app.use((req, res, next) => {
  req.db = db;
  req.db_iot = db_iot;
  next();
});

// Create HTTP and HTTPS servers
let httpServer, httpsServer, localHttpServer;

try {
  // Create HTTP server
  httpServer = http.createServer(app);

  // Create HTTPS server if SSL certificates are available
  try {
    const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, "utf8");
    const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, "utf8");
    const credentials = { key: privateKey, cert: certificate };
    httpsServer = https.createServer(credentials, app);
  } catch (error) {
    console.warn(
      "SSL certificates not found or invalid. HTTPS server will not start:",
      error.message
    );
  }

  // Create local development server
  localHttpServer = http.createServer(app);
} catch (error) {
  console.error("Failed to create servers:", error);
  process.exit(1);
}

// WebSocket Configuration
// Membuat WebSocketServer
const wss = new WebSocketServer({ noServer: true });

// Objek untuk menyimpan status koneksi berdasarkan path
const clientConnections = {
  "/status/mobile": [],
  "/chat": [],
  "/notifications": [],
};

// Menangani koneksi WebSocket
wss.on("connection", (ws, req) => {
  const path = req.url;
  console.log(`A new client connected to path: ${path}`);

  // Menyimpan koneksi WebSocket berdasarkan path
  if (clientConnections[path]) {
    clientConnections[path].push(ws);
    console.log(
      `Total clients connected to ${path}: ${clientConnections[path].length}`
    );
  }

  // Kirim pesan selamat datang saat koneksi berhasil
  ws.send(
    JSON.stringify({
      type: "welcome",
      message: `Welcome to the WebSocket server at ${path}!`,
    })
  );

  // Tangani pesan yang masuk dari klien
  ws.on("message", (message) => {
    console.log(`Message from client on ${path}: ${message}`);
  });

  // Menangani error
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  // Menangani koneksi yang terputus
  ws.on("close", () => {
    // Hapus koneksi yang terputus dari array
    console.log(`A client disconnected from ${path}. Remaining clients`);
  });
});
// Set up WebSocket upgrade handling for all servers
const handleUpgrade = (server) => {
  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });
};

// Apply WebSocket upgrade handler to all servers
if (httpServer) handleUpgrade(httpServer);
if (httpsServer) handleUpgrade(httpsServer);
if (localHttpServer) handleUpgrade(localHttpServer);

// Routes
// Unprotected routes
app.use("/", central_kitchen);
app.use("/", line1);
app.use("/", line2);
app.use("/", line6);
app.use("/", line7);
app.use("/", downtime_wafer);
app.use("/", lhp_wafer);
app.use("/", control_wafer);
app.use("/malkist", line2a); // Assuming line2a is a duplicate of line5, adjust as needed
app.use("/", line5);
app.use("/", line2b)
app.use("/", downtime_biscuit);
app.use("/", lhp_biscuit);

// ck3
app.use("/api", biscuitck3);
app.use("/api", biscuitck3v2);
app.use("/api", Biscuitpompack3);
app.use("/api", Biscuitagitatorck3);
app.use("/api", Biscuitckmalkist);

// Protected routes - use validateUser middleware
app.use("/api", utility);
app.use("/api", importRoutesWafer);
app.use("/api", importRoutesBiscuit);
app.use("/api", importRoutesAstor);
app.use("/api", importRoutesUtility);
app.use("/api/auth", authRoutes);
app.use("/api", users);
app.use("/api/setting", roleRoutes);
app.use("/api", qrchecklist);

app.use("/api", formtiket);
app.use("/api", settingpm);
app.use("/api", replacementpm);
app.use("/api", pmWeeklyTest);
app.use("/api", gdspMaster);
app.use("/api", gdspUser);
app.use("/api", gdspMasterData);

// Gas meter routes
app.use("/api", gasmeter);
// Sync database routes
app.use("/api", syncDatabase);
// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});


// Test endpoint
app.get("/test", async (req, res) => {
  try {
    res.send("HTTP server is running");
  } catch (error) {
    console.error("Error in test endpoint:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: "error", message: "Internal Server Error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Resource not found" });
});

// Start servers
if (httpServer) {
  httpServer.listen(httpPort, ipAddress, () => {
    console.log(`HTTP server running at http://${ipAddress}:${httpPort}`);
  });
}

if (httpsServer) {
  httpsServer.listen(httpsPort, ipAddress, () => {
    console.log(`HTTPS server running at https://${ipAddress}:${httpsPort}`);
  });
}

if (localHttpServer) {
  localHttpServer.listen(localHttpPort, "localhost", () => {
    console.log(
      `Local HTTP server running at http://localhost:${localHttpPort}`
    );
  });
}
transferDataCron.start();
// Handle process termination
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  httpServer?.close();
  httpsServer?.close();
  localHttpServer?.close();
  transferDataCron.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  httpServer?.close();
  httpsServer?.close();
  localHttpServer?.close();
  transferDataCron.close();
  process.exit(0);
});

export default app;
