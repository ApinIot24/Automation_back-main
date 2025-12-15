import express from "express";
import pool from "../../config/util.js";
import { users, updateUser, getRolesUser, getPermissionsUser, getUserById, deleteUserById } from "../../controllers/users/userController.js";
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

router.get("/roles", getRolesUser);

router.get("/permissions", getPermissionsUser);

router.get("/users/:id", getUserById);

router.delete("/users/:id", deleteUserById);

export default router;
