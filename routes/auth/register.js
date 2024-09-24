const express = require('express');
const router = express.Router();
const pool = require('../../config/util'); // Koneksi PostgreSQL
const md5 = require('md5'); // Menggunakan md5 untuk hashing
const jwt = require('jsonwebtoken');

const jwtKey = 'M4y0R@';
const jwtExpirySecond = 300;

// Route Login
router.post("/", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query untuk mencari user berdasarkan username di PostgreSQL
    const userResult = await pool.query('SELECT * FROM automation.users WHERE username = $1', [username]);

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
        message: 'password tidak sesuai'
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

module.exports = router;

// menambah Data m_M_pengguna ke DATABASE
// router.post("/register", (req, res, next) => {
//     M_penggunas.find({ email: req.body.email })
//         .exec()
//         .then(penggunas => {
//             if (penggunas.length >= 1) {
//                 return res.status(409).json({
//                     message: "E-mail Sudah Ada"
//                 });
//             } else {
//                 bcrypt.hash(req.body.password, 10, (err, hash) => {
//                     if (err) {
//                         return res.status(500).json({
//                             error: err
//                         });
//                     } else {
//                         const user = new M_penggunas({
//                             _id: new mongoose.Types.ObjectId(),
//                             username: req.body.username,
//                             email: req.body.email,
//                             password: hash,
//                             role: req.body.role,
//                             pengguna_role: "pegawai",
//                             pengguna_status: "Y",
//                             domain: req.body.domain
//                         });
//                         user.save()
//                             .then(result => {
//                                 console.log(result);
//                                 res.status(201).json({
//                                     message: "User Dibuat"
//                                 });
//                             })
//                             .catch(err => {
//                                 console.log(err);
//                                 res.status(500).json({
//                                     error: err
//                                 });
//                             });
//                     }
//                 })
//             }
//         })
// });

