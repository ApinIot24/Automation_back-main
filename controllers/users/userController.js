import db from "../../config/util.js";
import bcrypt from "bcryptjs";
import { executeQuery, countQuery } from "../../models/pagetable.js";

// Constants
const SORT_MAPPING = {
  id: "users.id",
  username: "users.username",
  role_name: "roles.role_name",
};

const TABLE_SCHEMA = "automation";
const DEFAULT_SORT = "id";

export const users = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      username,
      role,
      sortBy = DEFAULT_SORT,
      sortOrder = "asc",
    } = req.query;

    // Validasi dan parsing parameter
    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.max(1, parseInt(limit));
    const offset = (parsedPage - 1) * parsedLimit;

    // Membangun kondisi filter
    const filterConditions = [];
    const filterValues = [];
    let paramCount = 1;

    if (username) {
      filterConditions.push(`users.username ILIKE $${paramCount}`);
      filterValues.push(`%${username}%`);
      paramCount++;
    }
    if (role) {
      filterConditions.push(`roles.role_name = $${paramCount}`);
      filterValues.push(role);
      paramCount++;
    }

    // Validasi urutan sorting
    const validSortOrder = ["asc", "desc"].includes(sortOrder.toLowerCase())
      ? sortOrder.toUpperCase()
      : "ASC";

    const mappedSortColumn = SORT_MAPPING[sortBy] || SORT_MAPPING[DEFAULT_SORT];
    const orderClause = `ORDER BY ${mappedSortColumn} ${validSortOrder}`;

    // Membangun WHERE clause
    const whereClause = filterConditions.length
      ? `WHERE ${filterConditions.join(" AND ")}`
      : "";

    // Query untuk mengambil data users dengan permissions
    const selectQuery = `
      SELECT 
        users.id AS user_id,
        users.username,
        roles.role_name,
        COALESCE(
          ARRAY_AGG(
            DISTINCT permissions.permission_name
          ) FILTER (WHERE permissions.permission_name IS NOT NULL),
          ARRAY[]::text[]
        ) as permissions
      FROM ${TABLE_SCHEMA}.users
      LEFT JOIN ${TABLE_SCHEMA}.user_roles ON user_roles.user_id = users.id
      LEFT JOIN ${TABLE_SCHEMA}.roles ON user_roles.role_id = roles.id
      LEFT JOIN ${TABLE_SCHEMA}.role_permissions ON role_permissions.role_id = roles.id
      LEFT JOIN ${TABLE_SCHEMA}.permissions ON role_permissions.permission_id = permissions.id
      ${whereClause}
      GROUP BY users.id, users.username, roles.role_name
      ${orderClause}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    // Query untuk menghitung total records
    const countQuery = `
      SELECT COUNT(DISTINCT users.id) as total
      FROM ${TABLE_SCHEMA}.users
      LEFT JOIN ${TABLE_SCHEMA}.user_roles ON user_roles.user_id = users.id
      LEFT JOIN ${TABLE_SCHEMA}.roles ON user_roles.role_id = roles.id
      ${whereClause}
    `;

    // Eksekusi query
    const [rows, totalResult] = await Promise.all([
      db.query(selectQuery, [...filterValues, parsedLimit, offset]),
      db.query(countQuery, filterValues),
    ]);

    // Transformasi data untuk mendapatkan struktur yang diinginkan
    const transformedData = rows.rows.map((row) => ({
      user_id: row.user_id,
      username: row.username,
      role_name: row.role_name,
      permissions: row.permissions,
    }));

    // Hitung total dan jumlah halahan
    const total = parseInt(totalResult.rows[0].total);

    // Kirim response
    return res.status(200).json({
      status: "success",
      data: transformedData,
      pagination: {
        currentPage: parsedPage,
        pageSize: parsedLimit,
        totalRecords: total,
        totalPages: Math.ceil(total / parsedLimit),
      },
      filters: {
        username: username || null,
        role: role || null,
      },
      sorting: {
        sortBy,
        sortOrder: validSortOrder,
      },
    });
  } catch (error) {
    console.error("Error in getUsers:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// tidak dipakai
export const addUser = async (req, res) => {
  const { username, email, password, roles } = req.body;
  const client = await db.connect();

  try {
    // Validate input
    if (!username?.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Username is required",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    if (!password?.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Password is required",
      });
    }

    if (!roles) {
      return res.status(400).json({
        status: "error",
        message: "Role is required",
      });
    }

    await client.query("BEGIN");

    // Check if username already exists
    const existingUsername = await client.query(
      `SELECT id FROM ${TABLE_SCHEMA}.users WHERE username = $1`,
      [username]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Username already exists",
      });
    }

    // Check if email already exists
    const existingEmail = await client.query(
      `SELECT id FROM ${TABLE_SCHEMA}.users WHERE email = $1`,
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const userResult = await client.query(
      `INSERT INTO ${TABLE_SCHEMA}.users (username, email, password_hash) 
       VALUES ($1, $2, $3) RETURNING id`,
      [username, email, hashedPassword]
    );

    const userId = userResult.rows[0].id;

    // Find role ID
    const roleResult = await client.query(
      `SELECT id FROM ${TABLE_SCHEMA}.roles WHERE role_name = $1`,
      [roles]
    );

    if (roleResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        status: "error",
        message: "Invalid role",
      });
    }

    const roleId = roleResult.rows[0].id;

    // Assign role to user
    await client.query(
      `INSERT INTO ${TABLE_SCHEMA}.user_roles (user_id, role_id) VALUES ($1, $2)`,
      [userId, roleId]
    );

    // Get user permissions
    const permissionsResult = await client.query(
      `
      SELECT DISTINCT p.permission_name 
      FROM ${TABLE_SCHEMA}.permissions p
      JOIN ${TABLE_SCHEMA}.role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
    `,
      [roleId]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: {
        user_id: userId,
        username,
        role_name: roles,
        permissions: permissionsResult.rows.map((p) => p.permission_name),
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in addUser:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, roles } = req.body;
  const client = await db.connect();

  try {
    // Validate input
    if (!username?.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Username is required",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    await client.query("BEGIN");

    // Check if user exists
    const existingUser = await client.query(
      `SELECT id FROM ${TABLE_SCHEMA}.users WHERE id = $1`,
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Check for username conflict
    const usernameConflict = await client.query(
      `SELECT id FROM ${TABLE_SCHEMA}.users WHERE username = $1 AND id != $2`,
      [username, id]
    );

    if (usernameConflict.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Username already exists",
      });
    }

    // Check for email conflict
    const emailConflict = await client.query(
      `SELECT id FROM ${TABLE_SCHEMA}.users WHERE email = $1 AND id != $2`,
      [email, id]
    );

    if (emailConflict.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Email already exists",
      });
    }

    // Handle password update
    let hashedPassword = null;
    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update user information
    const updateUserQuery = hashedPassword
      ? `UPDATE ${TABLE_SCHEMA}.users 
         SET username = $1, email = $2, password_hash = $3 
         WHERE id = $4`
      : `UPDATE ${TABLE_SCHEMA}.users 
         SET username = $1, email = $2 
         WHERE id = $3`;

    const updateUserParams = hashedPassword
      ? [username, email, hashedPassword, id]
      : [username, email, id];

    await client.query(updateUserQuery, updateUserParams);

    // Handle role update if provided
    if (roles) {
      // Find role ID
      const roleResult = await client.query(
        `SELECT id FROM ${TABLE_SCHEMA}.roles WHERE role_name = $1`,
        [roles]
      );

      if (roleResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          status: "error",
          message: "Invalid role",
        });
      }

      const roleId = roleResult.rows[0].id;

      // Remove existing roles
      await client.query(
        `DELETE FROM ${TABLE_SCHEMA}.user_roles WHERE user_id = $1`,
        [id]
      );

      // Assign new role
      await client.query(
        `INSERT INTO ${TABLE_SCHEMA}.user_roles (user_id, role_id) VALUES ($1, $2)`,
        [id, roleId]
      );
    }

    // Get updated user's permissions
    const permissionsResult = await client.query(
      `
      SELECT DISTINCT p.permission_name 
      FROM ${TABLE_SCHEMA}.permissions p
      JOIN ${TABLE_SCHEMA}.role_permissions rp ON p.id = rp.permission_id
      JOIN ${TABLE_SCHEMA}.user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1
    `,
      [id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: {
        user_id: parseInt(id),
        username,
        role_name: roles,
        permissions: permissionsResult.rows.map((p) => p.permission_name),
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in updateUser:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

export default { users, addUser, updateUser };
