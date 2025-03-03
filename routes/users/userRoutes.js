import express from "express";
import pool from "../../config/util.js";
import { users, updateUser } from "../../controllers/users/userController.js";
import authMiddleware from "../../middlewares/authMiddleware.js"; // Pastikan path-nya sesuai
import roleAndPermissionMiddleware from "../../middlewares/roleAndPermissionMiddleware.js"; // Pastikan path-nya sesuai

const router = express.Router();

// Menambahkan middleware untuk otentikasi dan otorisasi
router.get(
  "/users",
  // authMiddleware, // Verifikasi autentikasi
  // roleAndPermissionMiddleware(["fa"]), // Verifikasi role dan permission
  users
);

router.put(
  "/users/:id",
  // authMiddleware, // Verifikasi autentikasi
  // roleAndPermissionMiddleware(["fa"]), // Verifikasi role dan permission
  updateUser
);

router.get("/roles", async (req, res) => {
  try {
    const query = `
      SELECT role_name FROM automation.roles;
    `;
    const result = await pool.query(query);

    // Mengirimkan hasil query ke klien
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/permissions", async (req, res) => {
  try {
    const query = `
      SELECT * FROM automation.permissions;
    `;
    const result = await pool.query(query);

    // Mengirimkan hasil query ke klien
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching permission:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users/:id", async (req, res) => {
  const { id } = req.params; // Get the user ID from the request parameters

  try {
    // SQL query to get a user by their ID along with roles
    const query = `
      SELECT u.id, u.username, u.email, r.role_name
      FROM automation.users u
      LEFT JOIN automation.user_roles ur ON u.id = ur.user_id
      LEFT JOIN automation.roles r ON ur.role_id = r.id
      WHERE u.id = $1;
    `;

    // Execute the query
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      // If no rows were retrieved, it means the user was not found
      return res.status(404).json({ message: "User not found" });
    }

    // If user exists, send the user data along with their role
    const user = result.rows[0]; // Assume first row contains the user and role data

    // Check if roles are present and send them back

    res.status(200).json({
      message: "User fetched successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.role_name,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    // Handle any error that occurs
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/users/:id", async (req, res) => {
  const { id } = req.params; // Get the user ID from the request parameters

  try {
    // SQL query to delete a user by their ID
    const query = `
      DELETE FROM automation.users
      WHERE id = $1
      RETURNING id;  -- We return the deleted user's ID to confirm deletion
    `;
    // Execute the query
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
      // If no rows were deleted, it means the user was not found
      return res.status(404).json({ message: "User not found" });
    }

    // If deletion is successful, send a success message with the deleted user's ID
    res
      .status(200)
      .json({ message: "User deleted successfully", id: result.rows[0].id });
  } catch (error) {
    console.error("Error deleting user:", error);
    // Handle any error that occurs
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
