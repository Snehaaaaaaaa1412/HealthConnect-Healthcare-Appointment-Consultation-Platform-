/**
 * Server Bootstrap
 *
 * Responsibilities:
 *   - Bootstrap environment variables (must be first)
 *   - Load the configured Express application from app.js
 *   - Import the database singleton from config/database.js
 *   - Register routes (to be migrated to src/routes/ in Milestone 8)
 *   - Start the HTTP listener
 *
 * Express configuration (middleware, CORS, static files) lives in app.js.
 * Database schema initialization lives in src/config/database.js.
 */
require("dotenv").config(); // Must be called before any other require reads process.env

const env = require("./src/config/env");
const app = require("./app");
const db = require("./src/config/database");
const errorMiddleware = require("./src/middleware/errorMiddleware");
const { protect } = require("./src/middleware/authMiddleware");
const apiRouter = require("./src/routes");
const asyncHandler = require("./src/utils/asyncHandler");
const ApiResponse = require("./src/utils/ApiResponse");
const { ValidationError } = require("./src/utils/ApiError");

// Apply global auth guard before routing starts (handles whitelist check inside protect)
app.use(protect);

// Mount central router
app.use(apiRouter);

// Background worker and core endpoints below

// Background Worker: Releases unpaid appointment lease-locks after 10 minutes
setInterval(() => {
  db.all(
    `SELECT * FROM appointments 
     WHERE paymentStatus = 'unpaid' 
       AND status = 'pending' 
       AND datetime(createdAt) < datetime('now', '-10 minutes')`,
    [],
    (err, rows) => {
      if (err) {
        console.error("Error fetching expired appointment locks:", err);
        return;
      }
      if (rows && rows.length > 0) {
        rows.forEach(appt => {
          db.serialize(() => {
            db.run("BEGIN IMMEDIATE TRANSACTION");
            db.get("SELECT slots FROM doctors WHERE username = ?", [appt.doctorUsername], (err2, doc) => {
              if (err2 || !doc) {
                db.run("ROLLBACK");
                return;
              }
              let slotsArr = [];
              try {
                slotsArr = JSON.parse(doc.slots || "[]");
              } catch (e) {
                slotsArr = [];
              }

              // Re-create the slot object to append back
              const restoredSlot = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                datetime: appt.slot,
                fee: appt.fee || 0.0
              };
              slotsArr.push(restoredSlot);

              db.run(
                `UPDATE doctors SET slots = ? WHERE username = ?`,
                [JSON.stringify(slotsArr), appt.doctorUsername],
                (err3) => {
                  if (err3) {
                    db.run("ROLLBACK");
                    return;
                  }
                  db.run(
                    `UPDATE appointments SET status = 'cancelled' WHERE id = ?`,
                    [appt.id],
                    (err4) => {
                      if (err4) {
                        db.run("ROLLBACK");
                        return;
                      }
                      db.run("COMMIT");
                      console.log(`[Escrow Lease Lock] Released expired slot lock for appointment ID ${appt.id}`);
                    }
                  );
                }
              );
            });
          });
        });
      }
    }
  );
}, 30000); // Scans database every 30 seconds

// Health check endpoint (exercises asyncHandler, ApiResponse, and ValidationError)
app.get("/health", asyncHandler(async (req, res) => {
  if (req.query.triggerError === "validation") {
    throw new ValidationError("Intentional validation error for testing M1.2");
  }
  res.json(ApiResponse.success({ status: "UP", database: "connected" }));
}));



// Global error handling middleware
app.use(errorMiddleware);

// Start server — port sourced from environment variable via src/config/env.js
app.listen(env.PORT, () => {
  console.log(`[HealthConnect] Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});