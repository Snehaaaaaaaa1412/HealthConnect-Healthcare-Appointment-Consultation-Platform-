"use strict";

/**
 * Environment Configuration
 *
 * Responsibility:
 *   Read all environment variables from process.env (populated by dotenv in
 *   server.js), validate required fields, and export a single typed config
 *   object consumed by the rest of the application.
 *
 * Why this matters:
 *   - A single source of truth for all configuration.
 *   - Type coercion happens once here (parseInt, parseFloat), not scattered
 *     throughout route handlers.
 *   - Hard-failing on missing production variables prevents silent
 *     misconfigurations from reaching users.
 *   - Easy to mock in tests: stub this module instead of process.env.
 *
 * Usage:
 *   const env = require("../config/env");
 *   console.log(env.PORT); // 5000
 */

const env = {
  // ─────────────────────────────────────────────────────────────
  // Server
  // ─────────────────────────────────────────────────────────────
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // ─────────────────────────────────────────────────────────────
  // Database
  // ─────────────────────────────────────────────────────────────
  DB_PATH: process.env.DB_PATH || "./info.db",

  // ─────────────────────────────────────────────────────────────
  // File Uploads
  // ─────────────────────────────────────────────────────────────
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10,

  // ─────────────────────────────────────────────────────────────
  // Authentication  (values used starting Milestone 13)
  // ─────────────────────────────────────────────────────────────
  JWT_SECRET: process.env.JWT_SECRET || "changeme_in_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // ─────────────────────────────────────────────────────────────
  // OTP  (used starting Milestone 14)
  // ─────────────────────────────────────────────────────────────
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,

  // ─────────────────────────────────────────────────────────────
  // Email / SMTP  (used starting Milestone 14)
  // ─────────────────────────────────────────────────────────────
  EMAIL_HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10) || 587,
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD || "",
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || "HealthConnect",

  // ─────────────────────────────────────────────────────────────
  // CORS / Frontend
  // ─────────────────────────────────────────────────────────────
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  // ─────────────────────────────────────────────────────────────
  // External Services
  // ─────────────────────────────────────────────────────────────
  FLASK_OCR_URL: process.env.FLASK_OCR_URL || "http://localhost:5001",
  OLLAMA_URL: process.env.OLLAMA_URL || "http://localhost:11434",

  // ─────────────────────────────────────────────────────────────
  // Admin Credentials  (used starting Milestone 13)
  // ─────────────────────────────────────────────────────────────
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin",
};

// ─────────────────────────────────────────────────────────────
// Production Guard
//
// Refuse to start in production if critical secrets are missing.
// This is the Node.js equivalent of a startup health check.
// ─────────────────────────────────────────────────────────────
if (env.NODE_ENV === "production") {
  const required = [
    "JWT_SECRET",
    "EMAIL_USER",
    "EMAIL_APP_PASSWORD",
    "DB_PATH",
  ];
  const missing = required.filter(
    (key) => !process.env[key] || process.env[key] === "changeme_in_production"
  );
  if (missing.length > 0) {
    throw new Error(
      `[HealthConnect] Missing required environment variables for production: ${missing.join(", ")}\n` +
      `Set these in your .env file or deployment environment before starting.`
    );
  }
}

module.exports = env;
