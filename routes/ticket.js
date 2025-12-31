import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { createTicket, deleteTicket, serveUpload, ticket, updateTicket } from "../controllers/ticket.js";
// Use import.meta.url to get the current directory in ES modules
const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Resolve __dirname in ES modules

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Initialize multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Handle form submission with file upload
router.post("/submit/tiket/form", upload.single("photo"), createTicket);

// Menambahkan middleware untuk otentikasi dan otorisasi
router.get("/ticket", ticket);

router.put("/ticket/:id", updateTicket);

router.delete("/ticket/:id", deleteTicket);

// Route to serve uploaded images
router.get("/uploads/:filename", serveUpload);

router.post("/send-whatsapp", async (req, res) => {
  const { phoneNumber, message } = req.body;

  try {
    const apiKey = "7631523"; // Ganti dengan API Key CallMeBot
    const whatsappUrl = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodeURIComponent(
      message
    )}&apikey=${apiKey}`;

    await axios.get(whatsappUrl);

    res.status(200).json({ success: true, message: "Pesan berhasil dikirim" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Gagal mengirim pesan" });
  }
});

export default router;
