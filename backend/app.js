"use strict";

/**
 * Express Application Factory
 *
 * Responsibility:
 *   Configure and export the Express application instance.
 *
 * Why separate from server.js?
 *   - server.js handles the HTTP lifecycle: port binding, DB init, process signals.
 *   - app.js handles Express configuration: middleware, routes, error handlers.
 *   - This separation makes the app importable without starting an HTTP listener,
 *     which is required for integration testing (supertest pattern).
 *
 * Milestone Note:
 *   Routes and error middleware will be progressively registered here
 *   as they are extracted from server.js in subsequent milestones.
 */

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const env = require("./src/config/env");

const app = express();

// ─────────────────────────────────────────────────────────────
// Core Middleware
// ─────────────────────────────────────────────────────────────

app.use(cors({
  origin: env.CORS_ORIGIN || "*",
  credentials: true
}));
app.use(bodyParser.json());

// Serve uploaded medical report files as static assets.
// This must be registered before any route handlers.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────
// Route modules will be mounted here progressively as each domain
// is extracted from server.js in Milestone 8 (Routes).
//
// Example (upcoming):
//   const routes = require("./src/routes");
//   app.use(routes);

// ─────────────────────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────────────────────
// The centralized error middleware will be registered here
// in Milestone 9 (Centralized Error Handling).

module.exports = app;
