"use strict";

const db = require("../config/database");
const asyncHandler = require("../utils/asyncHandler");

const chatController = {
  /**
   * Send a chat message
   */
  sendMessage: asyncHandler(async (req, res) => {
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
  }),

  /**
   * Get chat partners list for a doctor (patients with approved + paid appointments)
   */
  getDoctorPartners: asyncHandler(async (req, res) => {
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
  }),

  /**
   * Get chat partners list for a patient (doctors with approved + paid appointments)
   */
  getPatientPartners: asyncHandler(async (req, res) => {
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
  }),

  /**
   * Get the active consultation context between a doctor and patient
   */
  getChatContext: asyncHandler(async (req, res) => {
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
  }),

  /**
   * Get complete message log of a chat session
   */
  getConversation: asyncHandler(async (req, res) => {
    db.all(
      `SELECT * FROM messages WHERE doctorUsername = ? AND patientUsername = ? ORDER BY createdAt ASC, id ASC`,
      [req.params.doctorUsername, req.params.patientUsername],
      (err, rows) => {
        if (err) return res.json({ error: err.message });
        res.json(rows || []);
      }
    );
  })
};

module.exports = chatController;
