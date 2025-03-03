import express from "express";
import {
  getRoles,
  getPermissions,
} from "../../controllers/auth/roleController";

const router = express.Router();

router.get("/roles", getRoles);
router.get("/permissions", getPermissions);

export default router;
