import pg from 'pg';  // Import Pool dari pg
import cron from 'node-cron';  // Import node-cron untuk penjadwalan tugas
import { Router } from "express";
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
  user: 'it_purwosari',
  password: '3dced9c494bf',
  host: '10.2.8.70',
  port: 5432,
  database: 'iot',
});

// Fungsi untuk memeriksa koneksi
async function checkConnection(client) {
  try {
    await client.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('Connection failed:', err);
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
    console.log(`Attempt ${attempt} failed. Retrying in ${delay / 1000} seconds...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
}

// Fungsi untuk memindahkan data dari kedua tabel
async function transferData() {
  const client1 = await pool1.connect();
  const client2 = await pool2.connect();

  try {
    // Cek koneksi ke PostgreSQL 2 (client2) sebelum memulai transaksi
    const isConnected2 = await retryConnection(client2);
    if (!isConnected2) {
      throw new Error('Unable to connect to PostgreSQL 2');
    }

    // Mulai transaksi di PostgreSQL 1
    await client1.query('BEGIN');

    // Ambil semua data dari PostgreSQL 1 (skema automation)
    const resPompa = await client1.query('SELECT * FROM automation.ck_biscuit_pompa');
    const resMachineStatus = await client1.query('SELECT * FROM automation.l2a_machine_status');
    const resMachineStatusl5 = await client1.query('SELECT * FROM automation.l5_machine_status');

    if (resPompa.rows.length > 0) {
      // Coba untuk mengirim data ke PostgreSQL 2 (tabel ck_biscuit_pompa)
      for (const row of resPompa.rows) {
        try {
          // Insert data yang diambil ke PostgreSQL 2 (tabel ck_biscuit_pompa)
          await client2.query(
            'INSERT INTO purwosari.ck_biscuit_pompa (pompa, status, jam_aktif, jam_non_aktif, durasi, tanggal) VALUES ($1, $2, $3, $4, $5, $6)',
            [row.pompa, row.status, row.jam_aktif, row.jam_non_aktif, row.durasi, row.tanggal]
          );
          
          // Hapus data yang sudah dipindahkan dari PostgreSQL 1 (tabel ck_biscuit_pompa)
          await client1.query('DELETE FROM automation.ck_biscuit_pompa WHERE id = $1', [row.id]);
        } catch (err) {
          console.error(`Gagal mengirim data ID ${row.id} ke PostgreSQL 2 (ck_biscuit_pompa):`, err);
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
            'INSERT INTO purwosari.l2a_machine_status (machine, status, jam_aktif, jam_non_aktif, durasi, tanggal) VALUES ($1, $2, $3, $4, $5, $6)',
            [row.machine, row.status, row.jam_aktif, row.jam_non_aktif, row.durasi, row.tanggal]
          );
          
          // Hapus data yang sudah dipindahkan dari PostgreSQL 1 (tabel l2a_machine_status)
          await client1.query('DELETE FROM automation.l2a_machine_status WHERE id = $1', [row.id]);
        } catch (err) {
          console.error(`Gagal mengirim data ID ${row.id} ke PostgreSQL 2 (l2a_machine_status):`, err);
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
            'INSERT INTO purwosari.l5_machine_status (machine, status, jam_aktif, jam_non_aktif, durasi, tanggal) VALUES ($1, $2, $3, $4, $5, $6)',
            [row.machine, row.status, row.jam_aktif, row.jam_non_aktif, row.durasi, row.tanggal]
          );
          
          // Hapus data yang sudah dipindahkan dari PostgreSQL 1 (tabel l5_machine_status)
          await client1.query('DELETE FROM automation.l5_machine_status WHERE id = $1', [row.id]);
        } catch (err) {
          console.error(`Gagal mengirim data ID ${row.id} ke PostgreSQL 2 (l5_machine_status):`, err);
          continue;
        }
      }
    }

    // Commit transaksi di PostgreSQL 1
    await client1.query('COMMIT');
    console.log('Data berhasil dipindahkan ke PostgreSQL 2 dan dihapus dari PostgreSQL 1.');
  } catch (err) {
    // Rollback jika ada error
    await client1.query('ROLLBACK');
    console.error('Error terjadi:', err);
  } finally {
    // Tutup koneksi
    client1.release();
    client2.release();
  }
}

//buat test api untuk memicu transferData
app.get('/sync/transfer', async (req, res) => {
  try {
    await transferData();
    res.status(200).json({ message: 'Transfer data berhasil dijalankan.' });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi error saat transfer data.', error: err.message });
  }
});

// Menjadwalkan transferData untuk dijalankan setiap Minggu pukul 11 malam
cron.schedule('0 23 * * 0', () => {
  console.log('Menjalankan transfer data...');
  transferData();
});

export default app;
