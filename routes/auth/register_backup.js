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
    // Query untuk mencari user berdasarkan username di PostgreSQL
    const userResult = await req.db.query('SELECT * FROM automation.users WHERE username = $1', [username]);

    // Jika user tidak ditemukan
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: 'Username tidak ditemukan'
      });
    }

    const user = userResult.rows[0];

    // Membandingkan password yang di-hash dengan MD5
    const hashedPassword = md5(password);

    if (hashedPassword !== user.password) {
      return res.status(401).json({
        message: 'Password tidak sesuai'
      });
    }
    
    // Jika password benar, buat JWT
    const payload = {
      id: user.id,
      username: user.username,
      status: user.status
    };

    const token = jwt.sign(payload, jwtKey, { algorithm: 'HS256', expiresIn: jwtExpirySecond });

    // Kirimkan respons dengan token dan informasi pengguna
    return res.status(200).json({
      message: 'Login berhasil',
      token: token,
      username: user.username,
      status: user.status,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
