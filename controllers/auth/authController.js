import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { automationDB } from "../../src/db/automation.js";
// import pool from "../../config/util.js";
// Memuat variabel lingkungan

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: errors.array() });
  }

  const { username, email, password, roles } = req.body; // Tidak perlu permissions lagi
  const role_name = roles ? roles.role_name : null;
  
  // const client = await pool.connect(); // Start transaction using connection pool

  try {
    // await client.query("BEGIN"); // Mulai transaksi
    await automationDB.$transaction(async (tx) => {
      const existingUser = await tx.users.findUnique({
        where: { username },
        select: { id: true },
      })

      if (existingUser) {
        throw new Error("Username already exists")
      }

      const existingEmail = await tx.users.findFirst({
        where: { email },
        select: { id: true }
      })

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await tx.users.create({
        data: {
          username,
          email,
          password_hash: hashedPassword,
        }
      })

      const role = await tx.roles.findUnique({
        where: { role_name: role_name },
        select: { id: true }
      })

      if (!role) {
        throw new Error("Role not found")
      }

      await tx.user_roles.create({
        data: {
          user_id: newUser.id,
          role_id: role.id,
        }
      })

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
      })

    })

  } catch (error) {
    if (error.message === "USERNAME_TAKEN") {
      return res.status(400).json({ message: "Username already taken" });
    }
    if (error.message === "EMAIL_TAKEN") {
      return res.status(400).json({ message: "Email already registered" });
    }
    if (error.message === "ROLE_NOT_FOUND") {
      return res.status(400).json({ message: "Role not found" });
    }

    res.status(500).json({
      message: "An unexpected error occurred during registration",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const user = await automationDB.users.findFirst({
      where: { username },
      include: {
        user_roles: {
          include: { role: true },
        },
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ message: "Wrong Password" });

    const roles = user.user_roles.map((ur) => ur.role.role_name);

    const perms = await automationDB.role_permissions.findMany({
      where: { role_id: { in: user.user_roles.map((ur) => ur.role_id) } },
      include: { permission: true }
    });

    const permissions = perms
      .filter(p => p.permission)
      .map(p => p.permission.permission_name);

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
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
