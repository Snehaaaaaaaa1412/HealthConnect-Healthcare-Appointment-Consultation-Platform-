"use strict";

const express = require("express");
const router = express.Router();
const db = require("../config/database");
const upload = require("../middleware/uploadMiddleware");
const asyncHandler = require("../utils/asyncHandler");

// Appointment booking endpoint (transactional lock, optional medical report upload)
router.post("/appointments/book", upload.single("medicalReport"), asyncHandler(async (req, res) => {
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
}));

// Approve appointment endpoint (returns details for confirmation email)
router.post("/appointments/approve", asyncHandler(async (req, res) => {
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
}));

// Cancel appointment endpoint (with slot release)
router.post("/appointments/cancel", asyncHandler(async (req, res) => {
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
}));

// Payment completion endpoint
router.post("/appointments/pay", asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;
  db.run(
    `UPDATE appointments SET paymentStatus = 'Successful' WHERE id = ?`,
    [appointmentId],
    function (err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Payment processed successfully" });
    }
  );
}));

// Get patient appointments
router.get("/appointments/patient/:username", asyncHandler(async (req, res) => {
  db.all(
    `SELECT * FROM appointments WHERE patientUsername = ? ORDER BY id DESC`,
    [req.params.username],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
}));

// Get doctor appointments
router.get("/appointments/doctor/:username", asyncHandler(async (req, res) => {
  db.all(
    `SELECT * FROM appointments WHERE doctorUsername = ? ORDER BY id DESC`,
    [req.params.username],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
}));

// Submit prescription for an appointment (triggers escrow payout)
router.post("/appointments/prescribe", asyncHandler(async (req, res) => {
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
}));

module.exports = router;
