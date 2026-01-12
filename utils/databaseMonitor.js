import { Pool } from 'pg';
import { logDatabaseError, logErrorToFile, logInfo } from '../config/logger.js';

// Konfigurasi koneksi database
const automationConfig = {
  user: "automation",
  password: "Auto123",
  host: "localhost",
  port: 5432,
  database: "automation",
};

const iotConfig = {
  user: "it_purwosari",
  password: "3dced9c494bf",
  host: "10.2.8.70",
  port: 5432,
  database: "iot",
};

// Fungsi untuk memeriksa status koneksi database
export const checkDatabaseStatus = async (config, dbName) => {
  const pool = new Pool(config);
  let client;
  
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()');
    logInfo(`${dbName} database connection: OK`, 'database_monitor');
    return { status: 'connected', database: dbName };
  } catch (error) {
    logDatabaseError(error, `check_${dbName}_database`);
    return { status: 'error', database: dbName, error: error.message };
  } finally {
    if (client) client.release();
    await pool.end();
  }
};

// Fungsi untuk memeriksa semua koneksi database
export const checkAllDatabases = async () => {
  logInfo('Starting database connection check', 'database_monitor');
  
  const results = {
    automation: await checkDatabaseStatus(automationConfig, 'automation'),
    iot: await checkDatabaseStatus(iotConfig, 'iot'),
    timestamp: new Date().toISOString()
  };
  
  // Jika salah satu database tidak terhubung, kirim notifikasi
  const hasErrors = Object.values(results).some(r => r.status === 'error');
  if (hasErrors) {
    logErrorToFile(new Error('One or more databases are not accessible'), 'database_monitor_summary');
  } else {
    logInfo('All databases are accessible', 'database_monitor_summary');
  }
  
  return results;
};

// Fungsi untuk memeriksa database secara berkala
export const startDatabaseMonitoring = (intervalMinutes = 5) => {
  logInfo(`Starting database monitoring with ${intervalMinutes} minutes interval`, 'database_monitor');
  
  // Cek pertama kali
  checkAllDatabases();
  
  // Set interval untuk pemeriksaan berkala
  return setInterval(checkAllDatabases, intervalMinutes * 60 * 1000);
};