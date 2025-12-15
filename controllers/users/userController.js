import db from "../../config/util.js";
import bcrypt from "bcryptjs";
import { automationDB } from "../../src/db/automation.js";

const TABLE_SCHEMA = "automation";

const users = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      username,
      role,
      sortBy = "id",
      sortOrder = "asc",
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.max(1, parseInt(limit));
    const skip = (parsedPage - 1) * parsedLimit;

    // =====================
    // BASE FILTER (users only)
    // =====================
    const whereUser = {
      ...(username && {
        username: {
          contains: username,
          mode: "insensitive",
        },
      }),
    };

    // =====================
    // GET USERS (BASE)
    // =====================
    const [usersRows, total] = await Promise.all([
      automationDB.users.findMany({
        where: whereUser,
        skip,
        take: parsedLimit,
        orderBy: {
          [sortBy === "username" ? "username" : "id"]:
            sortOrder.toLowerCase() === "desc" ? "desc" : "asc",
        },
        select: {
          id: true,
          username: true,
        },
      }),
      automationDB.users.count({ where: whereUser }),
    ]);

    const userIds = usersRows.map((u) => u.id);

    // =====================
    // GET USER ROLES
    // =====================
    const userRoles = await automationDB.user_roles.findMany({
      where: {
        user_id: { in: userIds },
      },
      select: {
        user_id: true,
        role_id: true,
      },
    });

    const roleIds = [...new Set(userRoles.map((ur) => ur.role_id))];

    // =====================
    // GET ROLES
    // =====================
    const roles = roleIds.length
      ? await automationDB.roles.findMany({
          where: {
            id: { in: roleIds },
            ...(role && { role_name: role }),
          },
          select: {
            id: true,
            role_name: true,
          },
        })
      : [];

    const roleMap = {};
    roles.forEach((r) => {
      roleMap[r.id] = r.role_name;
    });

    // =====================
    // ROLE FILTER (AFTER JOIN)
    // =====================
    const filteredUsers = role
      ? usersRows.filter((u) =>
          userRoles.some(
            (ur) =>
              ur.user_id === u.id &&
              roleMap[ur.role_id] === role
          )
        )
      : usersRows;

    const filteredUserIds = filteredUsers.map((u) => u.id);

    // =====================
    // GET PERMISSIONS
    // =====================
    const rolePermissions = await automationDB.role_permissions.findMany({
      where: {
        role_id: { in: roleIds },
      },
      select: {
        role_id: true,
        permission_id: true,
      },
    });

    const permissionIds = [
      ...new Set(rolePermissions.map((rp) => rp.permission_id)),
    ];

    const permissions = permissionIds.length
      ? await automationDB.permissions.findMany({
          where: { id: { in: permissionIds } },
          select: {
            id: true,
            permission_name: true,
          },
        })
      : [];

    const permissionMap = {};
    permissions.forEach((p) => {
      permissionMap[p.id] = p.permission_name;
    });

    // =====================
    // TRANSFORM (ARRAY_AGG)
    // =====================
    const data = filteredUsers.map((u) => {
      const roleId = userRoles.find(
        (ur) => ur.user_id === u.id
      )?.role_id;

      const userPermissions = rolePermissions
        .filter((rp) => rp.role_id === roleId)
        .map((rp) => permissionMap[rp.permission_id]);

      return {
        user_id: u.id,
        username: u.username,
        role_name: roleMap[roleId] ?? null,
        permissions: [...new Set(userPermissions)],
      };
    });

    return res.status(200).json({
      status: "success",
      data,
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
        sortOrder: sortOrder.toUpperCase(),
      },
    });
  } catch (error) {
    console.error("Error in users:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

// const users = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       username,
//       role,
//       sortBy = DEFAULT_SORT,
//       sortOrder = "asc",
//     } = req.query;

//     // Validasi dan parsing parameter
//     const parsedPage = Math.max(1, parseInt(page));
//     const parsedLimit = Math.max(1, parseInt(limit));
//     const offset = (parsedPage - 1) * parsedLimit;

//     // Membangun kondisi filter
//     const filterConditions = [];
//     const filterValues = [];
//     let paramCount = 1;

//     if (username) {
//       filterConditions.push(`users.username ILIKE $${paramCount}`);
//       filterValues.push(`%${username}%`);
//       paramCount++;
//     }
//     if (role) {
//       filterConditions.push(`roles.role_name = $${paramCount}`);
//       filterValues.push(role);
//       paramCount++;
//     }

//     // Validasi urutan sorting
//     const validSortOrder = ["asc", "desc"].includes(sortOrder.toLowerCase())
//       ? sortOrder.toUpperCase()
//       : "ASC";

//     const mappedSortColumn = SORT_MAPPING[sortBy] || SORT_MAPPING[DEFAULT_SORT];
//     const orderClause = `ORDER BY ${mappedSortColumn} ${validSortOrder}`;

//     // Membangun WHERE clause
//     const whereClause = filterConditions.length
//       ? `WHERE ${filterConditions.join(" AND ")}`
//       : "";

//     // Query untuk mengambil data users dengan permissions
//     const selectQuery = `
//       SELECT 
//         users.id AS user_id,
//         users.username,
//         roles.role_name,
//         COALESCE(
//           ARRAY_AGG(
//             DISTINCT permissions.permission_name
//           ) FILTER (WHERE permissions.permission_name IS NOT NULL),
//           ARRAY[]::text[]
//         ) as permissions
//       FROM ${TABLE_SCHEMA}.users
//       LEFT JOIN ${TABLE_SCHEMA}.user_roles ON user_roles.user_id = users.id
//       LEFT JOIN ${TABLE_SCHEMA}.roles ON user_roles.role_id = roles.id
//       LEFT JOIN ${TABLE_SCHEMA}.role_permissions ON role_permissions.role_id = roles.id
//       LEFT JOIN ${TABLE_SCHEMA}.permissions ON role_permissions.permission_id = permissions.id
//       ${whereClause}
//       GROUP BY users.id, users.username, roles.role_name
//       ${orderClause}
//       LIMIT $${paramCount} OFFSET $${paramCount + 1}
//     `;

//     // Query untuk menghitung total records
//     const countQuery = `
//       SELECT COUNT(DISTINCT users.id) as total
//       FROM ${TABLE_SCHEMA}.users
//       LEFT JOIN ${TABLE_SCHEMA}.user_roles ON user_roles.user_id = users.id
//       LEFT JOIN ${TABLE_SCHEMA}.roles ON user_roles.role_id = roles.id
//       ${whereClause}
//     `;

//     // Eksekusi query
//     const [rows, totalResult] = await Promise.all([
//       db.query(selectQuery, [...filterValues, parsedLimit, offset]),
//       db.query(countQuery, filterValues),
//     ]);

//     // Transformasi data untuk mendapatkan struktur yang diinginkan
//     const transformedData = rows.rows.map((row) => ({
//       user_id: row.user_id,
//       username: row.username,
//       role_name: row.role_name,
//       permissions: row.permissions,
//     }));

//     // Hitung total dan jumlah halahan
//     const total = parseInt(totalResult.rows[0].total);

//     // Kirim response
//     return res.status(200).json({
//       status: "success",
//       data: transformedData,
//       pagination: {
//         currentPage: parsedPage,
//         pageSize: parsedLimit,
//         totalRecords: total,
//         totalPages: Math.ceil(total / parsedLimit),
//       },
//       filters: {
//         username: username || null,
//         role: role || null,
//       },
//       sorting: {
//         sortBy,
//         sortOrder: validSortOrder,
//       },
//     });
//   } catch (error) {
//     console.error("Error in getUsers:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Internal Server Error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

// tidak dipakai
const addUser = async (req, res) => {
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

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, roles } = req.body;
  const userId = Number(id);

  try {
    // =====================
    // VALIDATION
    // =====================
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

    // =====================
    // CHECK USER EXISTS
    // =====================
    const existingUser = await automationDB.users.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // =====================
    // CONFLICT CHECK
    // =====================
    const usernameConflict = await automationDB.users.findFirst({
      where: {
        username,
        NOT: { id: userId },
      },
    });

    if (usernameConflict) {
      return res.status(409).json({
        status: "error",
        message: "Username already exists",
      });
    }

    const emailConflict = await automationDB.users.findFirst({
      where: {
        email,
        NOT: { id: userId },
      },
    });

    if (emailConflict) {
      return res.status(409).json({
        status: "error",
        message: "Email already exists",
      });
    }

    // =====================
    // PASSWORD
    // =====================
    let password_hash;
    if (password && password.trim() !== "") {
      password_hash = await bcrypt.hash(password, 10);
    }

    // =====================
    // TRANSACTION
    // =====================
    const permissions = await automationDB.$transaction(async (tx) => {
      // 1️⃣ update user
      await tx.users.update({
        where: { id: userId },
        data: {
          username,
          email,
          ...(password_hash && { password_hash }),
        },
      });

      let roleId;

      // 2️⃣ update role if provided
      if (roles) {
        const role = await tx.roles.findUnique({
          where: { role_name: roles },
          select: { id: true },
        });

        if (!role) {
          throw new Error("INVALID_ROLE");
        }

        roleId = role.id;

        await tx.user_roles.deleteMany({
          where: { user_id: userId },
        });

        await tx.user_roles.create({
          data: {
            user_id: userId,
            role_id: roleId,
          },
        });
      }

      // 3️⃣ get permissions (SQL JOIN equivalent)
      const userRoles = await tx.user_roles.findMany({
        where: { user_id: userId },
        select: { role_id: true },
      });

      const roleIds = userRoles.map((ur) => ur.role_id);

      if (roleIds.length === 0) return [];

      const rolePermissions = await tx.role_permissions.findMany({
        where: { role_id: { in: roleIds } },
        select: { permission_id: true },
      });

      const permissionIds = [
        ...new Set(rolePermissions.map((rp) => rp.permission_id)),
      ];

      if (permissionIds.length === 0) return [];

      const permissions = await tx.permissions.findMany({
        where: { id: { in: permissionIds } },
        select: { permission_name: true },
      });

      return permissions.map((p) => p.permission_name);
    });

    return res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: {
        user_id: userId,
        username,
        role_name: roles,
        permissions,
      },
    });
  } catch (error) {
    console.error("Error in updateUser:", error);

    if (error.message === "INVALID_ROLE") {
      return res.status(400).json({
        status: "error",
        message: "Invalid role",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Failed to update user",
    });
  }
};

const getRolesUser = async (req, res) => {
  try {
    const roles = await automationDB.roles.findMany({
      select: {
        role_name: true,
      },
    });

    return res.status(200).json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getPermissionsUser = async (req, res) => {
  try {
    const permissions = await automationDB.permissions.findMany({});

    return res.status(200).json(permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  const userId = Number(id);

  try {
    // 1️⃣ ambil user
    const user = await automationDB.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 2️⃣ ambil role user (LEFT JOIN behavior)
    const userRole = await automationDB.user_roles.findFirst({
      where: { user_id: userId },
      select: { role_id: true },
    });

    let roleName = null;

    if (userRole) {
      const role = await automationDB.roles.findUnique({
        where: { id: userRole.role_id },
        select: { role_name: true },
      });

      roleName = role?.role_name ?? null;
    }

    return res.status(200).json({
      message: "User fetched successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: roleName,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteUserById = async (req, res) => {
  const { id } = req.params;
  const userId = Number(id);

  try {
    const user = await automationDB.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await automationDB.$transaction(async (tx) => {
      // hapus relasi dulu (FK-safe)
      await tx.user_roles.deleteMany({
        where: { user_id: userId },
      });

      await tx.users.delete({
        where: { id: userId },
      });
    });

    return res.status(200).json({
      message: "User deleted successfully",
      id: userId,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export { users, addUser, updateUser, getRolesUser, getPermissionsUser, getUserById, deleteUserById };