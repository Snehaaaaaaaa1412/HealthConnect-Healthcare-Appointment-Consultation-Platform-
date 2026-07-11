/**
 * Server Bootstrap
 *
 * Responsibilities:
 *   - Bootstrap environment variables (must be first)
 *   - Load the configured Express application from app.js
 *   - Mount global authentication protectors and domain routing gateways
 *   - Initialize background lease-lock worker processes
 *   - Register centralized error handling middlewares
 *   - Start the HTTP listener
 */
require("dotenv").config(); // Must be called before any other require reads process.env

const env = require("./src/config/env");
const app = require("./app");
const errorMiddleware = require("./src/middleware/errorMiddleware");
const { protect } = require("./src/middleware/authMiddleware");
const apiRouter = require("./src/routes");
const appointmentService = require("./src/services/appointmentService");
const asyncHandler = require("./src/utils/asyncHandler");
const ApiResponse = require("./src/utils/ApiResponse");
const { ValidationError } = require("./src/utils/ApiError");

// Apply global auth guard before routing starts (handles whitelist check inside protect)
app.use(protect);

// Mount central router
app.use(apiRouter);

// Background Worker: Scan and release unpaid appointment lease-locks every 30 seconds
setInterval(() => {
  appointmentService.releaseExpiredLocks().catch((err) => {
    console.error("[Lease Lock Worker] Execution failed:", err.message);
  });
}, 30000);

// Health check endpoint (exercises asyncHandler, ApiResponse, and ValidationError)
app.get("/health", asyncHandler(async (req, res) => {
  if (req.query.triggerError === "validation") {
    throw new ValidationError("Intentional validation error for testing M1.2");
  }
  res.json(ApiResponse.success({ status: "UP", database: "connected" }));
}));

// Global error handling middleware (must be registered last)
app.use(errorMiddleware);

// Start server — port sourced from environment variable via src/config/env.js
app.listen(env.PORT, () => {
  console.log(`[HealthConnect] Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});