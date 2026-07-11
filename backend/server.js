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
const userService  = require("./src/services/userService");
const vendorService = require("./src/services/vendorService");
const doctorService = require("./src/services/doctorService");
const asyncHandler = require("./src/utils/asyncHandler");
const ApiResponse = require("./src/utils/ApiResponse");
const { ValidationError } = require("./src/utils/ApiError");
const errorMiddleware = require("./src/middleware/errorMiddleware");
const { protect } = require("./src/middleware/authMiddleware");
const apiRouter = require("./src/routes");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Medical report uploads directory — path sourced from env.UPLOAD_DIR
const reportsDir = path.join(__dirname, env.UPLOAD_DIR, "medical_reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, reportsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".bmp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF and image files are allowed"));
  }
});

// Static file serving for /uploads is configured in app.js

// Database connection and schema initialization are handled by src/config/database.js
// The db singleton is imported above via require("./src/config/database")

// Apply global auth guard before routing starts (handles whitelist check inside protect)
app.use(protect);

// Mount central router
app.use(apiRouter);

// Admin API: Statistics Dashboard
app.get("/admin/stats", (req, res) => {
  db.get("SELECT COUNT(*) as count FROM users", [], (err1, uRow) => {
    db.get("SELECT COUNT(*) as count FROM doctors", [], (err2, dRow) => {
      db.get("SELECT COUNT(*) as count FROM vendors", [], (err3, vRow) => {
        if (err1 || err2 || err3) {
          return res.json({ error: "Failed to gather database statistics" });
        }
        res.json({
          usersCount: uRow ? uRow.count : 0,
          doctorsCount: dRow ? dRow.count : 0,
          vendorsCount: vRow ? vRow.count : 0
        });
      });
    });
  });
});

// Admin API: Get all doctors → doctorService → doctorRepository
app.get("/admin/doctors", async (req, res) => {
  try {
    const rows = await doctorService.getAllForAdmin();
    return res.json(rows);
  } catch (err) {
    return res.json({ error: err.message });
  }
});

// Admin API: Get all vendors → vendorService → vendorRepository
app.get("/admin/vendors", async (req, res) => {
  try {
    const rows = await vendorService.getAllForAdmin();
    return res.json(rows);
  } catch (err) {
    return res.json({ error: err.message });
  }
});

// Admin API: Approve Doctor → doctorService → doctorRepository
app.post("/admin/approve-doctor", async (req, res) => {
  try {
    const result = await doctorService.approveDoctor(req.body.id);
    return res.json(result);
  } catch (err) {
    return res.json({ error: err.message });
  }
});

// Admin API: Approve Vendor → vendorService → vendorRepository
app.post("/admin/approve-vendor", async (req, res) => {
  try {
    const result = await vendorService.approveVendor(req.body.id);
    return res.json(result);
  } catch (err) {
    return res.json({ error: err.message });
  }
});

// Admin API: Delete Practitioner → doctorService → doctorRepository
app.post("/admin/delete-doctor", async (req, res) => {
  try {
    const result = await doctorService.deleteDoctor(req.body.id);
    return res.json(result);
  } catch (err) {
    return res.json({ error: err.message });
  }
});

// Admin API: Delete Store → vendorService → vendorRepository
app.post("/admin/delete-vendor", async (req, res) => {
  try {
    const result = await vendorService.deleteVendor(req.body.id);
    return res.json(result);
  } catch (err) {
    return res.json({ error: err.message });
  }
});



// Appointment booking endpoint (transactional lock, optional medical report upload)
app.post("/appointments/book", upload.single("medicalReport"), (req, res) => {
  const {
    patientUsername,
    patientFullName,
    doctorUsername,
    doctorFullName,
    specialization,
    slot,
    symptoms,
    fee
  } = req.body;

  const medicalReportPath = req.file ? `/uploads/medical_reports/${req.file.filename}` : "";
  const symptomsText = (symptoms || "").trim();

  if (!symptomsText && !medicalReportPath) {
    return res.status(400).json({
      error: "Please provide symptoms, upload a medical report, or both."
    });
  }

  const symptomsToStore = symptomsText || "Medical report attached";

  let slotParsed = slot;
  if (typeof slot === "string" && slot.trim().startsWith("{")) {
    try {
      slotParsed = JSON.parse(slot);
    } catch (e) {
      slotParsed = slot;
    }
  }

  const slotDatetime = (typeof slotParsed === "object" && slotParsed !== null) ? slotParsed.datetime : slotParsed;
  const slotId = (typeof slotParsed === "object" && slotParsed !== null) ? slotParsed.id : null;
  const numericFee = parseFloat(fee) || 0.0;

  db.serialize(() => {
    // 1. Begin transaction to block concurrent writers
    db.run("BEGIN IMMEDIATE TRANSACTION");

    // 2. Fetch doctor's slots to verify availability
    db.get("SELECT slots FROM doctors WHERE username = ?", [doctorUsername], (err, doctor) => {
      if (err || !doctor) {
        db.run("ROLLBACK");
        return res.json({ error: "Doctor not found or database error" });
      }

      let slotsArr = [];
      try {
        slotsArr = JSON.parse(doctor.slots || "[]");
      } catch (e) {
        slotsArr = [];
      }

      // Check if slot is still available in the doctor's table
      const slotExists = slotsArr.some((s) => {
        if (typeof s === "object" && s !== null) {
          return s.id === slotId || s.datetime === slotDatetime;
        }
        return s === slotDatetime;
      });

      if (!slotExists) {
        db.run("ROLLBACK");
        return res.json({ error: "This slot is no longer available. It may have been booked or locked by another user." });
      }

      // Remove the booked slot
      const updatedSlots = slotsArr.filter((s) => {
        if (typeof s === "object" && s !== null) {
          return s.id !== slotId && s.datetime !== slotDatetime;
        }
        return s !== slotDatetime;
      });

      // 3. Insert the appointment as pending/unpaid
      db.run(
        `INSERT INTO appointments (patientUsername, patientFullName, doctorUsername, doctorFullName, specialization, slot, symptoms, fee, status, paymentStatus, escrowStatus, medicalReportPath) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', 'held', ?)`,
        [patientUsername, patientFullName, doctorUsername, doctorFullName, specialization, slotDatetime, symptomsToStore, numericFee, medicalReportPath],
        function (err2) {
          if (err2) {
            db.run("ROLLBACK");
            return res.json({ error: "Failed to create lease lock: " + err2.message });
          }

          // 4. Update the doctor's slots
          db.run(
            `UPDATE doctors SET slots = ? WHERE username = ?`,
            [JSON.stringify(updatedSlots), doctorUsername],
            function (err3) {
              if (err3) {
                db.run("ROLLBACK");
                return res.json({ error: "Failed to update doctor availability: " + err3.message });
              }

              // 5. Commit transaction
              db.run("COMMIT");
              res.json({ message: "Appointment booked successfully" });
            }
          );
        }
      );
    });
  });
});

// Approve appointment endpoint (returns details for confirmation email)
app.post("/appointments/approve", (req, res) => {
  const { appointmentId } = req.body;
  db.get("SELECT * FROM appointments WHERE id = ?", [appointmentId], (err, appt) => {
    if (err || !appt) return res.json({ error: "Appointment not found" });

    db.run(
      `UPDATE appointments SET status = 'approved' WHERE id = ?`,
      [appointmentId],
      function (err2) {
        if (err2) return res.json({ error: err2.message });

        db.get("SELECT email FROM users WHERE username = ?", [appt.patientUsername], (err3, patient) => {
          db.get("SELECT clinicTiming, clinicAddress, consultationAvailability, email FROM doctors WHERE username = ?", [appt.doctorUsername], (err4, doctor) => {
            const meetingLink = `https://meet.healthconnect.live/consult-${appointmentId}-${Date.now().toString(36)}`;
            res.json({
              message: "Appointment approved successfully",
              appointment: appt,
              patientEmail: patient ? patient.email : "",
              doctorClinic: doctor || {},
              meetingLink
            });
          });
        });
      }
    );
  });
});

// Cancel appointment endpoint (with slot release)
app.post("/appointments/cancel", (req, res) => {
  const { appointmentId } = req.body;
  db.get(`SELECT * FROM appointments WHERE id = ?`, [appointmentId], (err, appt) => {
    if (err || !appt) {
      return res.json({ error: "Appointment not found" });
    }

    db.run(
      `UPDATE appointments SET status = 'cancelled' WHERE id = ?`,
      [appointmentId],
      function (err2) {
        if (err2) return res.json({ error: err2.message });

        // Add the slot back to the doctor's available slots list
        db.get(`SELECT slots FROM doctors WHERE username = ?`, [appt.doctorUsername], (err3, row) => {
          if (err3 || !row) {
            console.error("Failed to get doctor slots for releasing:", err3);
            return res.json({ message: "Appointment cancelled, but slot release failed" });
          }

          let slotsArr = [];
          try {
            slotsArr = JSON.parse(row.slots || "[]");
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
            function (err4) {
              if (err4) {
                console.error("Failed to update doctor slots during cancel:", err4);
              }
              res.json({ message: "Appointment cancelled successfully" });
            }
          );
        });
      }
    );
  });
});

// Payment completion endpoint
app.post("/appointments/pay", (req, res) => {
  const { appointmentId } = req.body;
  db.run(
    `UPDATE appointments SET paymentStatus = 'Successful' WHERE id = ?`,
    [appointmentId],
    function (err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Payment processed successfully" });
    }
  );
});

// Get patient appointments
app.get("/appointments/patient/:username", (req, res) => {
  db.all(
    `SELECT * FROM appointments WHERE patientUsername = ? ORDER BY id DESC`,
    [req.params.username],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
});

// Get doctor appointments
app.get("/appointments/doctor/:username", (req, res) => {
  db.all(
    `SELECT * FROM appointments WHERE doctorUsername = ? ORDER BY id DESC`,
    [req.params.username],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
});

// Submit prescription for an appointment (triggers escrow payout)
app.post("/appointments/prescribe", (req, res) => {
  const { appointmentId, drug, dosage, times } = req.body;

  db.serialize(() => {
    db.run("BEGIN IMMEDIATE TRANSACTION");
    db.get("SELECT * FROM appointments WHERE id = ?", [appointmentId], (err, appt) => {
      if (err || !appt) {
        db.run("ROLLBACK");
        return res.json({ error: "Appointment not found or database error" });
      }

      if (appt.prescriptionDrug) {
        db.run("ROLLBACK");
        return res.json({ error: "Prescription has already been written for this consultation" });
      }

      db.run(
        `UPDATE appointments SET prescriptionDrug = ?, prescriptionDosage = ?, prescriptionRegimen = ? WHERE id = ?`,
        [drug, dosage, times, appointmentId],
        function (err2) {
          if (err2) {
            db.run("ROLLBACK");
            return res.json({ error: "Failed to write prescription: " + err2.message });
          }

          // Trigger Escrow Payout to Doctor if paid and escrow is still held
          if (appt.paymentStatus === "Successful" && appt.escrowStatus === "held") {
            const payoutAmount = appt.fee || 0.0;
            db.run(
              "UPDATE doctors SET balance = balance + ? WHERE username = ?",
              [payoutAmount, appt.doctorUsername],
              (err3) => {
                if (err3) {
                  db.run("ROLLBACK");
                  return res.json({ error: "Escrow payout failed: " + err3.message });
                }
                db.run(
                  "UPDATE appointments SET escrowStatus = 'released' WHERE id = ?",
                  [appointmentId],
                  (err4) => {
                    if (err4) {
                      db.run("ROLLBACK");
                      return res.json({ error: "Failed to update escrow state: " + err4.message });
                    }
                    db.run("COMMIT");
                    res.json({ message: "Prescription written successfully", payoutTransferred: payoutAmount });
                  }
                );
              }
            );
          } else {
            db.run("COMMIT");
            res.json({ message: "Prescription written successfully" });
          }
        }
      );
    });
  });
});

// Create pharmacy order (triggers split payout to vendor)
app.post("/orders/create", (req, res) => {
  const {
    patientUsername,
    patientFullName,
    vendorId,
    vendorStoreName,
    vendorPhone,
    items,
    totalAmount,
    address
  } = req.body;

  const numericAmount = parseFloat(totalAmount) || 0.0;
  const platformCut = numericAmount * 0.10; // 10% Platform Deduction
  const vendorAmount = numericAmount * 0.90; // 90% Vendor Payout

  db.serialize(() => {
    db.run("BEGIN IMMEDIATE TRANSACTION");
    db.run(
      `INSERT INTO orders (patientUsername, patientFullName, vendorId, vendorStoreName, vendorPhone, items, totalAmount, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [patientUsername, patientFullName, vendorId, vendorStoreName, vendorPhone, JSON.stringify(items), numericAmount, address],
      function (err) {
        if (err) {
          db.run("ROLLBACK");
          return res.json({ error: err.message });
        }

        // Update Vendor Balance
        db.run(
          "UPDATE vendors SET balance = balance + ? WHERE id = ?",
          [vendorAmount, vendorId],
          (err2) => {
            if (err2) {
              db.run("ROLLBACK");
              return res.json({ error: "Failed to transfer split payment to vendor: " + err2.message });
            }
            db.run("COMMIT");
            res.json({ message: "Order placed successfully", platformCommission: platformCut, vendorPayout: vendorAmount });
          }
        );
      }
    );
  });
});

// Get patient orders
app.get("/orders/patient/:username", (req, res) => {
  db.all(
    `SELECT * FROM orders WHERE patientUsername = ? ORDER BY id DESC`,
    [req.params.username],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
});

// Get vendor orders
app.get("/orders/vendor/:vendorId", (req, res) => {
  db.all(
    `SELECT * FROM orders WHERE vendorId = ? ORDER BY id DESC`,
    [req.params.vendorId],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
});

// Dispatch order
app.post("/orders/dispatch", (req, res) => {
  const { orderId } = req.body;
  db.run(
    `UPDATE orders SET status = 'Dispatched' WHERE id = ?`,
    [orderId],
    function (err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Order dispatched successfully" });
    }
  );
});

// Receive order
app.post("/orders/receive", (req, res) => {
  const { orderId } = req.body;
  db.run(
    `UPDATE orders SET status = 'Received' WHERE id = ?`,
    [orderId],
    function (err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Order received successfully" });
    }
  );
});

// Admin API: Analytics Dashboard
app.get("/admin/analytics", (req, res) => {
  db.all("SELECT status, COUNT(*) as count FROM appointments GROUP BY status", [], (err1, apptStatus) => {
    db.all("SELECT paymentStatus, COUNT(*) as count FROM appointments GROUP BY paymentStatus", [], (err2, apptPayment) => {
      db.all("SELECT status, COUNT(*) as count FROM orders GROUP BY status", [], (err3, orderStatus) => {
        db.get("SELECT SUM(fee) as totalConsultFee FROM appointments WHERE paymentStatus = 'Successful'", [], (err4, feeRow) => {
          db.get("SELECT SUM(totalAmount) as totalOrderAmount FROM orders WHERE status = 'Received' OR status = 'Dispatched'", [], (err5, orderRow) => {
            if (err1 || err2 || err3 || err4 || err5) {
              return res.json({ error: "Failed to fetch admin analytics data" });
            }
            const orderTotal = orderRow ? orderRow.totalOrderAmount || 0.0 : 0.0;
            res.json({
              appointmentsStatus: apptStatus || [],
              appointmentsPayment: apptPayment || [],
              ordersStatus: orderStatus || [],
              financials: {
                consultFees: feeRow ? feeRow.totalConsultFee || 0.0 : 0.0,
                orderAmount: orderTotal,
                platformCommission: orderTotal * 0.10
              }
            });
          });
        });
      });
    });
  });
});

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

// Chat: Send message between doctor and patient
app.post("/chat/send", (req, res) => {
  const { doctorUsername, patientUsername, senderRole, senderUsername, message } = req.body;
  if (!doctorUsername || !patientUsername || !senderRole || !message || !message.trim()) {
    return res.json({ error: "Missing required chat fields" });
  }
  db.run(
    `INSERT INTO messages (doctorUsername, patientUsername, senderRole, senderUsername, message) VALUES (?, ?, ?, ?, ?)`,
    [doctorUsername, patientUsername, senderRole, senderUsername || "", message.trim()],
    function (err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Message sent", id: this.lastID });
    }
  );
});

// Chat: List chat partners for a doctor (patients with approved + paid appointments)
app.get("/chat/doctor-partners/:doctorUsername", (req, res) => {
  db.all(
    `SELECT a.patientUsername, a.patientFullName, a.symptoms, a.medicalReportPath, a.slot, a.id AS appointmentId,
            (SELECT COUNT(*) FROM messages m
             WHERE m.doctorUsername = a.doctorUsername AND m.patientUsername = a.patientUsername) AS messageCount
     FROM appointments a
     INNER JOIN (
       SELECT patientUsername, MAX(id) AS maxId
       FROM appointments
       WHERE doctorUsername = ? AND status = 'approved' AND paymentStatus = 'Successful'
       GROUP BY patientUsername
     ) latest ON a.id = latest.maxId
     WHERE a.doctorUsername = ?
     ORDER BY a.patientFullName ASC`,
    [req.params.doctorUsername, req.params.doctorUsername],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// Chat: List chat partners for a patient (doctors with approved + paid appointments)
app.get("/chat/patient-partners/:patientUsername", (req, res) => {
  db.all(
    `SELECT a.doctorUsername, a.doctorFullName, a.symptoms, a.medicalReportPath, a.slot, a.id AS appointmentId,
            d.clinicTiming, d.clinicAddress,
            (SELECT COUNT(*) FROM messages m
             WHERE m.doctorUsername = a.doctorUsername AND m.patientUsername = a.patientUsername) AS messageCount
     FROM appointments a
     INNER JOIN (
       SELECT doctorUsername, MAX(id) AS maxId
       FROM appointments
       WHERE patientUsername = ? AND status = 'approved' AND paymentStatus = 'Successful'
       GROUP BY doctorUsername
     ) latest ON a.id = latest.maxId
     LEFT JOIN doctors d ON d.username = a.doctorUsername
     WHERE a.patientUsername = ?
     ORDER BY a.doctorFullName ASC`,
    [req.params.patientUsername, req.params.patientUsername],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// Chat: Get latest paid appointment context for a doctor-patient pair
app.get("/chat/context/:doctorUsername/:patientUsername", (req, res) => {
  db.get(
    `SELECT id, symptoms, medicalReportPath, slot, status, paymentStatus, patientFullName, doctorFullName
     FROM appointments
     WHERE doctorUsername = ? AND patientUsername = ?
       AND status = 'approved' AND paymentStatus = 'Successful'
     ORDER BY id DESC
     LIMIT 1`,
    [req.params.doctorUsername, req.params.patientUsername],
    (err, row) => {
      if (err) return res.json({ error: err.message });
      res.json(row || null);
    }
  );
});

// Chat: Get conversation between doctor and patient
app.get("/chat/:doctorUsername/:patientUsername", (req, res) => {
  db.all(
    `SELECT * FROM messages WHERE doctorUsername = ? AND patientUsername = ? ORDER BY createdAt ASC, id ASC`,
    [req.params.doctorUsername, req.params.patientUsername],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows || []);
    }
  );
});

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