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
    const result = await automationDB.$transaction(async (tx) => {
      // ===== CEK USERNAME =====
      const existingUser = await tx.users.findFirst({
        where: { username },
        select: { id: true },
      });

      if (existingUser) {
        throw new Error("USERNAME_TAKEN");
      }

      // ===== CEK EMAIL (kalau dikirim) =====
      if (email) {
        const existingEmail = await tx.users.findFirst({
          where: { email },
          select: { id: true },
        });

        if (existingEmail) {
          throw new Error("EMAIL_TAKEN");
        }
      }

      // ===== HASH PASSWORD =====
      const hashedPassword = await bcrypt.hash(password, 10);

      // ===== CREATE USER =====
      const newUser = await tx.users.create({
        data: {
          username,
          email,
          password_hash: hashedPassword,
        },
        select: {
          id: true,
          username: true,
          email: true,
        },
      });

      // ===== ASSIGN ROLE (OPSIONAL) =====
      if (role_name) {
        const role = await tx.roles.findFirst({
          where: { role_name },
          select: { id: true },
        });

        if (!role) {
          throw new Error("ROLE_NOT_FOUND");
        }

        await tx.user_roles.create({
          data: {
            user_id: newUser.id,
            role_id: role.id,
          },
        });
      }

      return newUser;
    });

    // ===== RESPONSE DI LUAR TRANSACTION =====
    return res.status(201).json({
      message: "User registered successfully",
      user: result,
    });

  } catch (error) {
    if (error.message === "USERNAME_TAKEN") {
      return res.status(409).json({ message: "Username already exists" });
    }

    if (error.message === "EMAIL_TAKEN") {
      return res.status(409).json({ message: "Email already registered" });
    }

    if (error.message === "ROLE_NOT_FOUND") {
      return res.status(400).json({ message: "Role not found" });
    }

    console.error("Register error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred during registration",
    });
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  const { username, password } = req.body;

  try {
    // ===== 1. USER =====
    const user = await automationDB.users.findFirst({
      where: { username },
      select: {
        id: true,
        username: true,
        password_hash: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password_hash) {
      return res.status(401).json({ message: "Account has no password set" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ===== 2. USER ROLES =====
    const userRoles = await automationDB.user_roles.findMany({
      where: { user_id: user.id },
      select: { role_id: true },
    });

    const roleIds = userRoles.map((r) => r.role_id);

    // ===== 3. ROLES =====
    const rolesData = await automationDB.roles.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, role_name: true },
    });

    const roles = rolesData.map((r) => r.role_name);

    // ===== 4. ROLE PERMISSIONS =====
    const rolePerms = await automationDB.role_permissions.findMany({
      where: { role_id: { in: roleIds } },
      select: { permission_id: true },
    });

    const permissionIds = rolePerms.map((p) => p.permission_id);

    // ===== 5. PERMISSIONS =====
    const perms = await automationDB.permissions.findMany({
      where: { id: { in: permissionIds } },
      select: { permission_name: true },
    });

    const permissions = perms.map((p) => p.permission_name);

    // ===== 6. JWT =====
    if (!process.env.SECRET_KEY) {
      throw new Error("JWT_SECRET_NOT_DEFINED");
    }

    const token = jwt.sign(
      {
        id: user.id,
        roles,
        permissions,
      },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          roles,
          permissions,
        },
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      message: "An unexpected error occurred during login",
    });
  }
};