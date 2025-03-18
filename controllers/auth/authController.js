import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../config/util.js";
import dotenv from "dotenv";

// Memuat variabel lingkungan
dotenv.config();

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: errors.array() });
  }

  const { username, email, password, roles } = req.body; // Tidak perlu permissions lagi
  const role_name = roles ? roles.role_name : null;
  const client = await pool.connect(); // Start transaction using connection pool

  try {
    await client.query("BEGIN"); // Mulai transaksi

    // Mengecek apakah username sudah terdaftar
    const existingUserResult = await client.query(
      "SELECT 1 FROM automation.users WHERE username = $1",
      [username]
    );

    if (existingUserResult.rows.length > 0) {
      await client.query("ROLLBACK"); // Rollback jika username sudah ada
      return res.status(400).json({ message: "Username already taken" });
    }

    const usersemail = await client.query(
      "SELECT id FROM automation.users WHERE email = $1", // Check if the email exists first
      [email]
    );

    if (usersemail.rows.length > 0) {
      // If email already exists, rollback and return an error message
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Email already registered" });
    }
    // Hash password menggunakan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Menyimpan data user baru ke dalam database
    const userResult = await client.query(
      "INSERT INTO automation.users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [username, email, hashedPassword]
    );

    const userId = userResult.rows[0].id;

    // Menentukan role user
    const roleResult = await client.query(
      "SELECT id FROM automation.roles WHERE role_name = $1",
      [role_name]
    );
    if (roleResult.rows.length === 0) {
      await client.query("ROLLBACK"); // Rollback jika role tidak ditemukan
      return res.status(400).json({ message: "Role not found" });
    }

    const roleId = roleResult.rows[0].id;

    // Menyimpan relasi user dan role
    await client.query(
      "INSERT INTO automation.user_roles (user_id, role_id) VALUES ($1, $2)",
      [userId, roleId]
    );

    await client.query("COMMIT"); // Commit transaksi jika semua berhasil

    res.status(201).json({ message: "User registered successfully!", userId });
  } catch (error) {
    await client.query("ROLLBACK");
    // console.log(error)
    res
      .status(500)
      .json({ message: "An unexpected error occurred during registration" });
  } finally {
    client.release(); // Pastikan untuk melepaskan koneksi ke pool
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Mengecek apakah user dengan username yang diberikan ada di database
    const userResult = await pool.query(
      "SELECT * FROM automation.users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // Mengecek kecocokan password dengan hash yang ada di database
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: "Wrong Password" });
    }

    // Mendapatkan role dari user
    const roleResult = await pool.query(
      `SELECT r.role_name FROM automation.roles r
       INNER JOIN automation.user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const roles = roleResult.rows.map((role) => role.role_name);

    // Mendapatkan permissions dari role
    const permissionResult = await pool.query(
      `SELECT p.permission_name FROM automation.permissions p
       INNER JOIN automation.role_permissions rp ON rp.permission_id = p.id
       INNER JOIN automation.user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const permissions = permissionResult.rows.map(
      (perm) => perm.permission_name
    );

    // Membuat token JWT yang mencakup roles dan permissions
    const token = jwt.sign(
      { id: user.id, roles, permissions },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        token,
        user: { id: user.id, username: user.username, roles, permissions },
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An unexpected error occurred during login" });
  }
};
