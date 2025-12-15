// scripts/database_requipment.js
// Script untuk menjalankan CREATE EXTENSION IF NOT EXISTS "uuid-ossp" ke database
import pg from "pg";
import { env } from "../config/env.js";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

async function setupUuidExtension() {
  let pool = null;
  
  try {
    // Get connection string from environment
    const connectionString = env.automationDb || process.env.AUTOMATION_DB_URL;
    
    if (!connectionString) {
      throw new Error(
        "AUTOMATION_DB_URL tidak ditemukan. Pastikan environment variable sudah di-set."
      );
    }

    console.log("🔌 Menghubungkan ke database...");
    
    // Create connection pool
    pool = new Pool({
      connectionString: connectionString,
    });

    // Test connection
    const client = await pool.connect();
    console.log("✅ Koneksi database berhasil!");

    try {
      // Check if extension already exists
      const checkResult = await client.query(
        `SELECT EXISTS(
          SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
        ) as exists`
      );

      if (checkResult.rows[0].exists) {
        console.log("ℹ️  Extension 'uuid-ossp' sudah ada di database.");
      } else {
        console.log("📦 Membuat extension 'uuid-ossp'...");
        
        // Create extension
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        
        console.log("✅ Extension 'uuid-ossp' berhasil dibuat!");
      }

      // Verify extension
      const verifyResult = await client.query(
        `SELECT extname, extversion FROM pg_extension WHERE extname = 'uuid-ossp'`
      );
      
      if (verifyResult.rows.length > 0) {
        console.log(
          `✅ Verifikasi: Extension 'uuid-ossp' versi ${verifyResult.rows[0].extversion} tersedia.`
        );
      }
    } finally {
      client.release();
    }

    console.log("🎉 Setup database extension selesai!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the script
setupUuidExtension();
