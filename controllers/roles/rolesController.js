// rolesController.js
import { automationDB } from "../../src/db/automation.js";

export const getRoles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role_name,
      sortBy = "id",
      sortOrder = "asc",
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.max(1, parseInt(limit));
    const skip = (parsedPage - 1) * parsedLimit;

    const orderBy = {
      [sortBy === "role_name" ? "role_name" : "id"]:
        sortOrder.toLowerCase() === "desc" ? "desc" : "asc",
    };

    const where = role_name
      ? {
          role_name: {
            contains: role_name,
            mode: "insensitive",
          },
        }
      : {};

    // 1️⃣ ambil roles dulu
    const [roles, total] = await Promise.all([
      automationDB.roles.findMany({
        where,
        skip,
        take: parsedLimit,
        orderBy,
        select: {
          id: true,
          role_name: true,
        },
      }),
      automationDB.roles.count({ where }),
    ]);

    const roleIds = roles.map((r) => r.id);

    // 2️⃣ ambil permissions via table pivot
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

    // 3️⃣ map SQL-like result
    const permissionMap = {};
    permissions.forEach((p) => {
      permissionMap[p.id] = p.permission_name;
    });

    const permissionsByRole = {};
    rolePermissions.forEach((rp) => {
      if (!permissionsByRole[rp.role_id]) {
        permissionsByRole[rp.role_id] = [];
      }
      permissionsByRole[rp.role_id].push(
        permissionMap[rp.permission_id]
      );
    });

    const data = roles.map((r) => ({
      roles_id: r.id,
      role_name: r.role_name,
      permissions: permissionsByRole[r.id] || [],
    }));

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
        role_name: role_name || null,
      },
      sorting: {
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
      },
    });
  } catch (error) {
    console.error("Error in getRoles:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}

export const addRole = async (req, res) => {
  const { role_name, permissions } = req.body;

  try {
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

    const existingRole = await automationDB.roles.findUnique({
      where: { role_name },
    });

    if (existingRole) {
      return res.status(409).json({
        status: "error",
        message: "Role name already exists",
      });
    }

    const validPermissions = await automationDB.permissions.findMany({
      where: { id: { in: permissions } },
      select: { id: true },
    });

    if (validPermissions.length !== permissions.length) {
      return res.status(400).json({
        status: "error",
        message: "One or more invalid permission IDs provided",
      });
    }

    const role = await automationDB.$transaction(async (tx) => {
      const createdRole = await tx.roles.create({
        data: { role_name },
      });

      await tx.role_permissions.createMany({
        data: permissions.map((permissionId) => ({
          role_id: createdRole.id,
          permission_id: permissionId,
        })),
      });

      return createdRole;
    });

    return res.status(201).json({
      status: "success",
      message: "Role created successfully",
      data: {
        id: role.id,
        role_name,
        permissions: validPermissions,
      },
    });
  } catch (error) {
    console.error("Error in addRole:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create role",
      error:
      process.env.NODE_ENV === "development"
        ? error.message
        : undefined,
    });
  }
};

export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { role_name, permissions } = req.body;

  try {
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

    const role = await automationDB.roles.findUnique({
      where: { id: Number(id) },
    });

    if (!role) {
      return res.status(404).json({
        status: "error",
        message: "Role not found",
      });
    }

    const nameConflict = await automationDB.roles.findFirst({
      where: {
        role_name,
        NOT: { id: Number(id) },
      },
    });

    if (nameConflict) {
      return res.status(409).json({
        status: "error",
        message: "Role name already exists",
      });
    }

    const validPermissions = await automationDB.permissions.findMany({
      where: { id: { in: permissions } },
      select: { id: true },
    });

    if (validPermissions.length !== permissions.length) {
      return res.status(400).json({
        status: "error",
        message: "One or more invalid permission IDs provided",
      });
    }

    await automationDB.$transaction(async (tx) => {
      await tx.roles.update({
        where: { id: Number(id) },
        data: { role_name },
      });

      await tx.role_permissions.deleteMany({
        where: { role_id: Number(id) },
      });

      await tx.role_permissions.createMany({
        data: permissions.map((permissionId) => ({
          role_id: Number(id),
          permission_id: permissionId,
        })),
      });
    });

    return res.status(200).json({
      status: "success",
      message: "Role updated successfully",
      data: {
        id: Number(id),
        role_name,
        permissions: validPermissions,
      },
    });
  } catch (error) {
    console.error("Error in updateRole:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update role",
    });
  }
};

export const getRoleById = async (req, res) => {
  const { id } = req.params;
  const roleId = Number(id);

  try {
    // 1️⃣ ambil role
    const role = await automationDB.roles.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        role_name: true,
      },
    });

    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    // 2️⃣ ambil role_permissions (pivot)
    const rolePermissions = await automationDB.role_permissions.findMany({
      where: { role_id: roleId },
      select: { permission_id: true },
    });

    return res.status(200).json({
      message: "Role fetched successfully",
      data: {
        id: role.id,
        role_name: role.role_name,
        permissions: rolePermissions.map(
          (rp) => rp.permission_id
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const deleteRoleById = async (req, res) => {
  const { id } = req.params;

  try {
    const role = await automationDB.roles.findUnique({
      where: { id: Number(id) },
    });

    if (!role) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    await automationDB.$transaction(async (tx) => {
      await tx.role_permissions.deleteMany({
        where: { role_id: Number(id) },
      });

      await tx.roles.delete({
        where: { id: Number(id) },
      });
    });

    return res.status(200).json({
      message: "Role deleted successfully",
      id: Number(id),
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};