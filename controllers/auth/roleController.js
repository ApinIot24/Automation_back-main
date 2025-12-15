import { automationDB } from "../../src/db/automation.js";

// Get all roles
export const getRoles = async (req, res) => {
  try {
    const roles = await automationDB.roles.findMany({})
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all permissions
export const getPermissions = async (req, res) => {
  try {
    const permissions = await automationDB.permissions.findMany({})
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
