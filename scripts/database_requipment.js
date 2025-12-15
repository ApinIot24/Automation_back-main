import { Pool } from 'pg';
import { env } from '../config/env.js'; // Pastikan env sudah dikonfigurasi dengan benar
import dotenv from 'dotenv';

dotenv.config();

async function setupUuidExtension() {
  let pool = null;
  let client = null;

  try {
    // Ambil string koneksi dari environment
    const connectionString = env.automationDb || process.env.AUTOMATION_DB_URL;
    
    if (!connectionString) {
      throw new Error('AUTOMATION_DB_URL tidak ditemukan. Pastikan environment variable sudah di-set.');
    }

    console.log('🔌 Menghubungkan ke database...');

    // Membuat pool koneksi
    pool = new Pool({
      connectionString: connectionString,
    });

    // Menghubungkan ke database
    client = await pool.connect();
    console.log('✅ Koneksi database berhasil!');

    // Memeriksa apakah ekstensi uuid-ossp sudah ada
    console.log('🔍 Memeriksa apakah ekstensi "uuid-ossp" sudah ada di database...');
    const checkResult = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
      ) as exists
    `);

    if (checkResult.rows[0].exists) {
      console.log('ℹ️  Extension "uuid-ossp" sudah ada di database.');
    } else {
      console.log('📦 Membuat ekstensi "uuid-ossp"...');
      
      // Menjalankan perintah untuk membuat ekstensi
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✅ Ekstensi "uuid-ossp" berhasil dibuat!');
    }

    // Verifikasi ekstensi
    console.log('🔍 Memverifikasi apakah ekstensi "uuid-ossp" berhasil dibuat...');
    const verifyResult = await client.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'uuid-ossp'
    `);

    if (verifyResult.rows.length > 0) {
      console.log(`✅ Verifikasi: Extension "uuid-ossp" versi ${verifyResult.rows[0].extversion} tersedia.`);
    } else {
      throw new Error('❌ Verifikasi gagal: Extension "uuid-ossp" tidak ditemukan setelah pembuatan.');
    }

    console.log('🎉 Setup ekstensi database selesai!');

  } catch (error) {
    // Menangani error
    console.error('❌ Terjadi error:', error.message);
    console.error(error);
    process.exit(1); // Keluar dengan kode status 1 (error)
  } finally {
    // Pastikan untuk melepaskan koneksi dan menutup pool
    if (client) {
      client.release();
    }

    if (pool) {
      await pool.end();
    }
  }
}

// Jalankan fungsi setupUuidExtension
setupUuidExtension();
