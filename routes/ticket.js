import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { ticket, updateTicket } from "../controllers/ticket.js";

// Use import.meta.url to get the current directory in ES modules
const router = Router();
const __dirname = path.dirname(new URL(import.meta.url).pathname); // Resolve __dirname in ES modules

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
router.post("/submit/tiket/form", upload.single("photo"), async (req, res) => {
  try {
    // Check if all required fields are present
    if (!req.body.category || !req.body.description || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Get form data
    const { category, description } = req.body;
    const photoFilename = req.file.filename;
    const timestamp = new Date();

    // Insert record into database
    const result = await req.db.query(
      "INSERT INTO ticket.history (category, description, photo_path, created_at) VALUES ($1, $2, $3, $4) RETURNING id",
      [category, description, photoFilename, timestamp]
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      data: {
        id: result.rows[0].id,
        category,
        description,
        photoPath: photoFilename,
        createdAt: timestamp,
      },
    });
  } catch (error) {
    console.error("Error submitting form:", error);

    // Handle Multer file size error
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size should be less than 5MB",
      });
    }

    // General error handling
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
});
// Menambahkan middleware untuk otentikasi dan otorisasi
router.get("/ticket", ticket);

router.put("/ticket/:id", updateTicket);

router.delete("/ticket/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the ticket exists
    const checkTicketQuery =
      "SELECT photo_path FROM ticket.history WHERE id = $1";
    const ticketResult = await req.db.query(checkTicketQuery, [id]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Delete the ticket from the database
    const deleteQuery =
      "DELETE FROM ticket.history WHERE id = $1 RETURNING id, photo_path";
    const result = await req.db.query(deleteQuery, [id]);

    // If a photo_path exists, delete the associated image from the server
    if (result.rows[0].photo_path) {
      const filePath = path.join(
        __dirname,
        "../uploads",
        result.rows[0].photo_path
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Delete the file from the server
      }
    }

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the ticket",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Route to serve uploaded images
router.get("/uploads/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.filename);

  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({
      success: false,
      message: "Image not found",
    });
  }
});

export default router;
