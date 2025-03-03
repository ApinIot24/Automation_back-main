// rolesController.js
import db from "../../config/util.js";
import { executeQuery, countQuery } from "../../models/pagetable.js";

// Constants
const SORT_MAPPING = {
  id: "roles.id",
  role_name: "roles.role_name",
};

const TABLE_SCHEMA = "automation";
const DEFAULT_SORT = "id";

export const getRoles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role_name,
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

    if (role_name) {
      filterConditions.push(`roles.role_name ILIKE $${paramCount}`);
      filterValues.push(`%${role_name}%`);
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

    // Query untuk mengambil data roles dengan permissions
    const selectQuery = `
      SELECT 
        roles.id AS roles_id,
        roles.role_name,
        COALESCE(
          ARRAY_AGG(
            DISTINCT permissions.permission_name
          ) FILTER (WHERE permissions.permission_name IS NOT NULL),
          ARRAY[]::text[]
        ) as permissions
      FROM ${TABLE_SCHEMA}.roles
      LEFT JOIN ${TABLE_SCHEMA}.role_permissions rp ON rp.role_id = roles.id
      LEFT JOIN ${TABLE_SCHEMA}.permissions permissions ON rp.permission_id = permissions.id
      ${whereClause}
      GROUP BY roles.id, roles.role_name
      ${orderClause}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    // Query untuk menghitung total records
    const countQuery = `
      SELECT COUNT(DISTINCT roles.id) as total
      FROM ${TABLE_SCHEMA}.roles
      LEFT JOIN ${TABLE_SCHEMA}.role_permissions rp ON rp.role_id = roles.id
      ${whereClause}
    `;

    // Eksekusi query
    const [rows, totalResult] = await Promise.all([
      db.query(selectQuery, [...filterValues, parsedLimit, offset]),
      db.query(countQuery, filterValues),
    ]);

    // Transformasi data untuk mendapatkan struktur yang diinginkan
    const transformedData = rows.rows.map((row) => ({
      roles_id: row.roles_id,
      role_name: row.role_name,
      permissions: row.permissions,
    }));

    // Hitung total dan jumlah halaman
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
        role_name: role_name || null,
      },
      sorting: {
        sortBy,
        sortOrder: validSortOrder,
      },
    });
  } catch (error) {
    console.error("Error in getRoles:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const addRole = async (req, res) => {
  const { role_name, permissions } = req.body;
  const client = await db.connect();

  try {
    // Validate input
    if (!role_name?.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Role name is required",
      });
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "At least one permission is required",
      });
    }

    await client.query("BEGIN");

    // Check if role name already exists
    const existingRole = await client.query(
      `SELECT id FROM ${TABLE_SCHEMA}.roles WHERE role_name = $1`,
      [role_name]
    );

    if (existingRole.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Role name already exists",
      });
    }

    // Insert new role
    const roleResult = await client.query(
      `INSERT INTO ${TABLE_SCHEMA}.roles (role_name) VALUES ($1) RETURNING id`,
      [role_name]
    );

    const roleId = roleResult.rows[0].id;

    // Validate all permissions exist
    const permissionQuery = `
      SELECT id FROM ${TABLE_SCHEMA}.permissions 
      WHERE id = ANY($1::int[])
    `;

    const validPermissions = await client.query(permissionQuery, [permissions]);

    if (validPermissions.rows.length !== permissions.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        status: "error",
        message: "One or more invalid permission IDs provided",
      });
    }

    // Insert role permissions
    const rolePermissionValues = permissions
      .map((permissionId) => `(${roleId}, ${permissionId})`)
      .join(", ");

    await client.query(`
      INSERT INTO ${TABLE_SCHEMA}.role_permissions (role_id, permission_id)
      VALUES ${rolePermissionValues}
    `);

    await client.query("COMMIT");

    return res.status(201).json({
      status: "success",
      message: "Role created successfully",
      data: {
        id: roleId,
        role_name,
        permissions: validPermissions.rows,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in addRole:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create role",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { role_name, permissions } = req.body;
  const client = await db.connect();

  try {
    // Validate input
    if (!role_name?.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Role name is required",
      });
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "At least one permission is required",
      });
    }

    await client.query("BEGIN");

    // Check if role exists
    const existingRole = await client.query(
      `SELECT id FROM ${TABLE_SCHEMA}.roles WHERE id = $1`,
      [id]
    );

    if (existingRole.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Role not found",
      });
    }

    // Check for role name conflict
    const nameConflict = await client.query(
      `SELECT id FROM ${TABLE_SCHEMA}.roles WHERE role_name = $1 AND id != $2`,
      [role_name, id]
    );

    if (nameConflict.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Role name already exists",
      });
    }

    // Validate all permissions exist
    const permissionQuery = `
      SELECT id FROM ${TABLE_SCHEMA}.permissions 
      WHERE id = ANY($1::int[])
    `;

    const validPermissions = await client.query(permissionQuery, [permissions]);

    if (validPermissions.rows.length !== permissions.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        status: "error",
        message: "One or more invalid permission IDs provided",
      });
    }

    // Update role name
    await client.query(
      `UPDATE ${TABLE_SCHEMA}.roles SET role_name = $1 WHERE id = $2`,
      [role_name, id]
    );

    // Update permissions (delete and insert approach)
    await client.query(
      `DELETE FROM ${TABLE_SCHEMA}.role_permissions WHERE role_id = $1`,
      [id]
    );

    const rolePermissionValues = permissions
      .map((permissionId) => `(${id}, ${permissionId})`)
      .join(", ");

    await client.query(`
      INSERT INTO ${TABLE_SCHEMA}.role_permissions (role_id, permission_id)
      VALUES ${rolePermissionValues}
    `);

    await client.query("COMMIT");

    return res.status(200).json({
      status: "success",
      message: "Role updated successfully",
      data: {
        id: parseInt(id),
        role_name,
        permissions: validPermissions.rows,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in updateRole:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update role",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};
