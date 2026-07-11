"use strict";

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const env = require("../config/env");

// Medical report uploads directory — resolved relative to project root
const reportsDir = path.join(__dirname, "..", "..", env.UPLOAD_DIR, "medical_reports");

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, reportsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".bmp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  }
});

module.exports = uploadMiddleware;
