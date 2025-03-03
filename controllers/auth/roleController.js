import pool from "../../config/util.js";

// Get all roles
export const getRoles = async (req, res) => {
  try {
    const roles = await pool.query("SELECT * FROM roles");
    res.status(200).json(roles.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all permissions
export const getPermissions = async (req, res) => {
  try {
    const permissions = await pool.query("SELECT * FROM permissions");
    res.status(200).json(permissions.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
