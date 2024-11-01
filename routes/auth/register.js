// routes/auth/login.js
import express from 'express';
import db from '../../config/util.js'; // Koneksi PostgreSQL
import md5 from 'md5'; // Menggunakan md5 untuk hashing
import jwt from 'jsonwebtoken';

const router = express.Router();

const jwtKey = 'M4y0R@';
const jwtExpirySecond = 300;

// Route Login
router.post("/", async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log("Mencari user berdasarkan username...");
    const userResult = await db.query('SELECT * FROM automation.users WHERE username = $1', [username]);

    console.log("User ditemukan:", userResult.rows);

    if (userResult.rows.length === 0) {
      console.log("User tidak ditemukan");
      return res.status(401).json({
        message: 'Username tidak ditemukan'
      });
    }

    const user = userResult.rows[0];
    const hashedPassword = md5(password);

    console.log("Password yang di-hash:", hashedPassword);
    if (hashedPassword !== user.password) {
      return res.status(401).json({
        message: 'Password tidak sesuai'
      });
    }

    const payload = {
      id: user.id,
      username: user.username,
      status: user.status
    };

    const token = jwt.sign(payload, jwtKey, { algorithm: 'HS256', expiresIn: jwtExpirySecond });
    console.log("Token berhasil dibuat:", token);

    return res.status(200).json({
      message: 'Login berhasil',
      token: token,
      username: user.username,
      status: user.status,
      role: user.role,
    });
  } catch (err) {
    console.error("Terjadi error:", err);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
