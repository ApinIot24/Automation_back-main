// sync_database/syncdatabase.js
import pg from "pg"; // Import Pool dari pg
import cron from "node-cron"; // Import node-cron untuk penjadwalan tugas
import { Router } from "express";
import { logErrorToFile, logDatabaseError, logInfo } from "../config/logger.js";
const { Pool } = pg;
const app = Router();
// Koneksi ke PostgreSQL 1 (Automation)
const pool1 = new Pool({
  user: "automation",
  password: "Auto123",
  host: "10.37.12.17",
  port: 5432,
  database: "automation",
});

// Koneksi ke PostgreSQL 2 (IoT)
const pool2 = new Pool({
  user: "it_purwosari",
  password: "3dced9c494bf",
  host: "10.2.8.70",
  port: 5432,
  database: "iot",
});

// Fungsi untuk memeriksa koneksi
async function checkConnection(client) {
  try {
    await client.query("SELECT 1");
    return true;
  } catch (err) {
    logDatabaseError(err, "check_connection");
    return false;
  }
}

// Fungsi untuk retry koneksi
async function retryConnection(client, retries = 3, delay = 5000) {
  let attempt = 0;
  while (attempt < retries) {
    if (await checkConnection(client)) {
      return true;
    }
    attempt++;
    const message = `Attempt ${attempt} failed. Retrying in ${delay / 1000} seconds...`;
    logInfo(message, "connection_retry");
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  logErrorToFile(new Error(`Failed to connect to database after ${retries} attempts`), "connection_retry_failed");
  return false;
}

// Fungsi untuk memindahkan data dari kedua tabel
async function transferData() {
  logInfo("Starting data transfer process", "transfer_data");
  
  let client1, client2;
  
  try {
    client1 = await pool1.connect();
    logInfo("Connected to PostgreSQL 1 (Automation)", "connection_established");
  } catch (err) {
    logDatabaseError(err, "connect_to_postgresql_1");
    throw new Error("Unable to connect to PostgreSQL 1");
  }
  
  try {
    client2 = await pool2.connect();
    logInfo("Connected to PostgreSQL 2 (IoT)", "connection_established");
  } catch (err) {
    logDatabaseError(err, "connect_to_postgresql_2");
    
    // Still continue with PostgreSQL 1 if PostgreSQL 2 is not available
    logInfo("Continuing with PostgreSQL 1 only", "connection_fallback");
  }

  try {
    // Cek koneksi ke PostgreSQL 2 (client2) sebelum memulai transaksi
    if (client2) {
      const isConnected2 = await retryConnection(client2);
      if (!isConnected2) {
        throw new Error("Unable to connect to PostgreSQL 2");
      }
    }

    // Mulai transaksi di PostgreSQL 1
    await client1.query("BEGIN");

    // Ambil semua data dari PostgreSQL 1 (skema automation)
    const resPompa = await client1.query(
      "SELECT * FROM automation.ck_biscuit_pompa"
    );
    const resValve = await client1.query(
      "SELECT * FROM automation.ck_biscuit_valve"
    );
    const resMachineStatus = await client1.query(
      "SELECT * FROM automation.l2a_machine_status"
    );
    const resMachineStatusl5 = await client1.query(
      "SELECT * FROM automation.l5_machine_status"
    );

    if (resPompa.rows.length > 0) {
      // Coba untuk mengirim data ke PostgreSQL 2 (tabel ck_biscuit_pompa)
      for (const row of resPompa.rows) {
        try {
          // Insert data yang diambil ke PostgreSQL 2 (tabel ck_biscuit_pompa)
          await client2.query(
            "INSERT INTO purwosari.ck_biscuit_pompa (pompa, status, jam_aktif, jam_non_aktif, durasi, tanggal) VALUES ($1, $2, $3, $4, $5, $6)",
            [
              row.pompa,
              row.status,
              row.jam_aktif,
              row.jam_non_aktif,
              row.durasi,
              row.tanggal,
            ]
          );

          // Hapus data yang sudah dipindahkan dari PostgreSQL 1 (tabel ck_biscuit_pompa)
          await client1.query(
            "DELETE FROM automation.ck_biscuit_pompa WHERE id = $1",
            [row.id]
          );
        } catch (err) {
          logErrorToFile(err, `Failed to send ID ${row.id} to PostgreSQL 2 (ck_biscuit_pompa)`);
          continue;
        }
      }
    }

    if (resValve.rows.length > 0) {
      // Coba untuk mengirim data ke PostgreSQL 2 (tabel ck_biscuit_valve)
      for (const row of resValve.rows) {
        try {
          // Insert data yang diambil ke PostgreSQL 2 (tabel ck_biscuit_valve)
          await client2.query(
            "INSERT INTO purwosari.ck_biscuit_valve (valve, status, jam_aktif, jam_non_aktif, durasi, tanggal) VALUES ($1, $2, $3, $4, $5, $6)",
            [
              row.valve,
              row.status,
              row.jam_aktif,
              row.jam_non_aktif,
              row.durasi,
              row.tanggal,
            ]
          );

          // Hapus data yang sudah dipindahkan dari PostgreSQL 1 (tabel ck_biscuit_valve)
          await client1.query(
            "DELETE FROM automation.ck_biscuit_valve WHERE id = $1",
            [row.id]
          );
        } catch (err) {
          logErrorToFile(err, `Failed to send ID ${row.id} to PostgreSQL 2 (ck_biscuit_valve)`);
          continue;
        }
      }
    }

    if (resMachineStatus.rows.length > 0) {
      // Coba untuk mengirim data ke PostgreSQL 2 (tabel l2a_machine_status)
      for (const row of resMachineStatus.rows) {
        try {
          // Insert data yang diambil ke PostgreSQL 2 (tabel l2a_machine_status)
          await client2.query(
            "INSERT INTO purwosari.l2a_machine_status (machine, status, jam_aktif, jam_non_aktif, durasi, tanggal) VALUES ($1, $2, $3, $4, $5, $6)",
            [
              row.machine,
              row.status,
              row.jam_aktif,
              row.jam_non_aktif,
              row.durasi,
              row.tanggal,
            ]
          );

          // Hapus data yang sudah dipindahkan dari PostgreSQL 1 (tabel l2a_machine_status)
          await client1.query(
            "DELETE FROM automation.l2a_machine_status WHERE id = $1",
            [row.id]
          );
        } catch (err) {
          logErrorToFile(err, `Failed to send ID ${row.id} to PostgreSQL 2 (l2a_machine_status)`);
          continue;
        }
      }
    }

    if (resMachineStatusl5.rows.length > 0) {
      // Coba untuk mengirim data ke PostgreSQL 2 (tabel l5_machine_status)
      for (const row of resMachineStatusl5.rows) {
        try {
          // Insert data yang diambil ke PostgreSQL 2 (tabel l5_machine_status)
          await client2.query(
            "INSERT INTO purwosari.l5_machine_status (machine, status, jam_aktif, jam_non_aktif, durasi, tanggal) VALUES ($1, $2, $3, $4, $5, $6)",
            [
              row.machine,
              row.status,
              row.jam_aktif,
              row.jam_non_aktif,
              row.durasi,
              row.tanggal,
            ]
          );

          // Hapus data yang sudah dipindahkan dari PostgreSQL 1 (tabel l5_machine_status)
          await client1.query(
            "DELETE FROM automation.l5_machine_status WHERE id = $1",
            [row.id]
          );
        } catch (err) {
          logErrorToFile(err, `Failed to send ID ${row.id} to PostgreSQL 2 (l5_machine_status)`);
          continue;
        }
      }
    }

    // Commit transaksi di PostgreSQL 1
    await client1.query("COMMIT");
    logInfo("Data successfully moved from PostgreSQL 1 and deleted from source", "transfer_complete");
    
    if (client2) {
      logInfo("Data successfully transferred to PostgreSQL 2", "transfer_complete");
    }
  } catch (err) {
    // Rollback jika ada error
    await client1.query("ROLLBACK");
    logErrorToFile(err, "transfer_data_error");
  } finally {
    // Tutup koneksi
    if (client1) {
      client1.release();
      logInfo("PostgreSQL 1 connection closed", "connection_closed");
    }
    
    if (client2) {
      client2.release();
      logInfo("PostgreSQL 2 connection closed", "connection_closed");
    }
  }
}

//buat test api untuk memicu transferData
app.get("/sync/transfer", async (req, res) => {
  try {
    logInfo("Manual data transfer triggered via API", "api_trigger");
    await transferData();
    res.status(200).json({ message: "Transfer data successfully executed." });
  } catch (err) {
    logErrorToFile(err, "API transfer_data_error");
    res
      .status(500)
      .json({
        message: "Error occurred during data transfer.",
        error: err.message,
      });
  }
});

// Menjadwalkan transferData untuk dijalankan setiap Minggu pukul 11 malam
export const transferDataCron = cron.schedule(
  "0 12 * * 0",
  () => {
    logInfo("Running data transfer from CRON...", "cron_job");
    transferData();
  },
  { 
    timezone: "Asia/Jakarta",
    scheduled: true,
    onComplete: () => {
      logInfo("Data transfer cron job completed", "cron_job");
    }
  }
);

export default app;
