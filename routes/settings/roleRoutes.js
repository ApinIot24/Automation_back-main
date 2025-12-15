import express from "express";
import {
  getRoles,
  addRole,
  updateRole,
  getRoleById,
  deleteRoleById,
} from "../../controllers/roles/rolesController.js";
// import authMiddleware from "../../middlewares/authMiddleware.js"; // Pastikan path-nya sesuai
// import roleAndPermissionMiddleware from "../../middlewares/roleAndPermissionMiddleware.js"; // Pastikan path-nya sesuai

const router = express.Router();

// Menambahkan middleware untuk otentikasi dan otorisasi
router.get(
  "/roles",
  // authMiddleware, // Verifikasi autentikasi
  // roleAndPermissionMiddleware(["fa"]), // Verifikasi role dan permission
  getRoles
);

router.post(
  "/roles",
  // authMiddleware, // Verifikasi autentikasi
  // roleAndPermissionMiddleware(["fa"]), // Verifikasi role dan permission
  addRole
);

router.put(
  "/roles/:id",
  // authMiddleware, // Verifikasi autentikasi
  // roleAndPermissionMiddleware(["fa"]), // Verifikasi role dan permission
  updateRole
);

router.get("/roles/:id", getRoleById
  // async (req, res) => {
  //   const { id } = req.params; // Get the role ID from the request parameters
  //   try {
  //     // SQL query to get a role by its ID along with the permissions
  //     const query = `
  //       SELECT 
  //         u.id, 
  //         u.role_name, 
  //         ARRAY_AGG(DISTINCT ur.permission_id) AS permissions  -- Menggabungkan permission_id unik menjadi array
  //       FROM 
  //         automation.roles u
  //       LEFT JOIN 
  //         automation.role_permissions ur ON u.id = ur.role_id
  //       WHERE 
  //         u.id = $1  -- Filter untuk role dengan ID tertentu
  //       GROUP BY 
  //         u.id, u.role_name  -- Harus di-group by supaya ARRAY_AGG bekerja
  //     `;

  //     // Execute the query
  //     const result = await pool.query(query, [id]);

  //     if (result.rowCount === 0) {
  //       // If no rows were retrieved, it means the role was not found
  //       return res.status(404).json({ message: "Role not found" });
  //     }

  //     // Get the role and permissions data from the result
  //     const role = result.rows[0]; // Assume the first row contains the role and role data

  //     // Respond with the role and its permissions
  //     res.status(200).json({
  //       message: "Role fetched successfully",
  //       data: {
  //         id: role.id,
  //         role_name: role.role_name, // Return the role name
  //         permissions: role.permissions, // Return the permissions as an array
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Error fetching role:", error);
  //     // Handle any error that occurs
  //     res.status(500).json({ message: "Internal server error" });
  //   }
  // }
);

router.delete("/roles/:id", deleteRoleById
  // async (req, res) => {
  //   const { id } = req.params; // Get the role ID from the request parameters

  //   try {
  //     // SQL query to delete a role by their ID
  //     const query = `
  //       DELETE FROM automation.roles
  //       WHERE id = $1
  //       RETURNING id;  -- We return the deleted role's ID to confirm deletion
  //     `;
  //     // Execute the query
  //     const result = await pool.query(query, [id]);
  //     if (result.rowCount === 0) {
  //       // If no rows were deleted, it means the role was not found
  //       return res.status(404).json({ message: "Role not found" });
  //     }

  //     // If deletion is successful, send a success message with the deleted role's ID
  //     res
  //       .status(200)
  //       .json({ message: "Role deleted successfully", id: result.rows[0].id });
  //   } catch (error) {
  //     console.error("Error deleting role:", error);
  //     // Handle any error that occurs
  //     res.status(500).json({ message: "Internal server error" });
  //   }
  // }
);

export default router;
