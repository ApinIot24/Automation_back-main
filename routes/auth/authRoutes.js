import express from "express";
import { register, login } from "../../controllers/auth/authController.js";
import { body } from "express-validator";

const router = express.Router();

// Middleware untuk validasi input
const validateRegister = [
  body("username")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("password")
    .isLength({ min: 2 })
    .withMessage("Password must be at least 2 characters long"),
];

const validateLogin = [
  body("username").notEmpty().withMessage("username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);

export default router;
