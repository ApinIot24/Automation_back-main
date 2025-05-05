import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

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
      "INSERT INTO tiket.history (category, description, photo_path, created_at) VALUES ($1, $2, $3, $4) RETURNING id",
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

router.get("/get/test", (req, res) => {
  console.log("test");
  res.status(201).json({ message: "Test" });
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
