"use strict";

/**
 * Chat Repository
 *
 * Responsibility:
 *   All database operations for the `messages` table and chat-related
 *   queries that join across `appointments` and `doctors`.
 *
 * Design decisions:
 *   - getDoctorPartners() and getPatientPartners() use a subquery with
 *     MAX(id) + GROUP BY to return only the most recent appointment per
 *     unique doctor-patient pair. This mirrors the original server.js logic
 *     exactly — no business logic changes.
 *
 *   - getContext() returns a single appointment row (the latest approved +
 *     paid appointment for a doctor-patient pair). The service layer uses
 *     this to provide context for the chat UI (symptoms, medical report, slot).
 *
 *   - saveMessage() trims the message string at the repository level since
 *     it is a data integrity concern (we never want to store leading/trailing
 *     whitespace in the database).
 */

const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");

const chatRepository = {
  /**
   * Persist a new chat message between a doctor and patient.
   *
   * @param {{ doctorUsername, patientUsername, senderRole, senderUsername, message }} data
   * @returns {Promise<{ lastID: number, changes: number }>}
   */
  saveMessage: ({ doctorUsername, patientUsername, senderRole, senderUsername, message }) =>
    dbRun(
      `INSERT INTO messages (doctorUsername, patientUsername, senderRole, senderUsername, message)
       VALUES (?, ?, ?, ?, ?)`,
      [doctorUsername, patientUsername, senderRole, senderUsername || "", message.trim()]
    ),

  /**
   * Retrieve the full message history between a doctor and patient.
   * Ordered chronologically (createdAt ASC, then id ASC as tiebreaker).
   *
   * @param {string} doctorUsername
   * @param {string} patientUsername
   * @returns {Promise<Array>}
   */
  getConversation: (doctorUsername, patientUsername) =>
    dbAll(
      `SELECT * FROM messages
       WHERE doctorUsername = ? AND patientUsername = ?
       ORDER BY createdAt ASC, id ASC`,
      [doctorUsername, patientUsername]
    ),

  /**
   * Get a doctor's list of chat-eligible patients.
   * A patient is eligible if they have an approved + paid appointment
   * with this doctor. Returns one row per unique patient (most recent
   * appointment only), including message count for the chat badge.
   *
   * @param {string} doctorUsername
   * @returns {Promise<Array>}
   */
  getDoctorPartners: (doctorUsername) =>
    dbAll(
      `SELECT a.patientUsername, a.patientFullName, a.symptoms,
              a.medicalReportPath, a.slot, a.id AS appointmentId,
              (SELECT COUNT(*) FROM messages m
               WHERE m.doctorUsername = a.doctorUsername
                 AND m.patientUsername = a.patientUsername) AS messageCount
       FROM appointments a
       INNER JOIN (
         SELECT patientUsername, MAX(id) AS maxId
         FROM appointments
         WHERE doctorUsername = ?
           AND status = 'approved'
           AND paymentStatus = 'Successful'
         GROUP BY patientUsername
       ) latest ON a.id = latest.maxId
       WHERE a.doctorUsername = ?
       ORDER BY a.patientFullName ASC`,
      [doctorUsername, doctorUsername]
    ),

  /**
   * Get a patient's list of chat-eligible doctors.
   * A doctor is eligible if the patient has an approved + paid appointment
   * with them. Returns one row per unique doctor, including clinic info
   * and message count.
   *
   * @param {string} patientUsername
   * @returns {Promise<Array>}
   */
  getPatientPartners: (patientUsername) =>
    dbAll(
      `SELECT a.doctorUsername, a.doctorFullName, a.symptoms,
              a.medicalReportPath, a.slot, a.id AS appointmentId,
              d.clinicTiming, d.clinicAddress,
              (SELECT COUNT(*) FROM messages m
               WHERE m.doctorUsername = a.doctorUsername
                 AND m.patientUsername = a.patientUsername) AS messageCount
       FROM appointments a
       INNER JOIN (
         SELECT doctorUsername, MAX(id) AS maxId
         FROM appointments
         WHERE patientUsername = ?
           AND status = 'approved'
           AND paymentStatus = 'Successful'
         GROUP BY doctorUsername
       ) latest ON a.id = latest.maxId
       LEFT JOIN doctors d ON d.username = a.doctorUsername
       WHERE a.patientUsername = ?
       ORDER BY a.doctorFullName ASC`,
      [patientUsername, patientUsername]
    ),

  /**
   * Get the latest approved + paid appointment between a doctor and patient.
   * Used to load consultation context (symptoms, medical report path, slot)
   * into the chat window header.
   *
   * @param {string} doctorUsername
   * @param {string} patientUsername
   * @returns {Promise<Object|null>}
   */
  getContext: (doctorUsername, patientUsername) =>
    dbGet(
      `SELECT id, symptoms, medicalReportPath, slot, status, paymentStatus,
              patientFullName, doctorFullName
       FROM appointments
       WHERE doctorUsername = ? AND patientUsername = ?
         AND status = 'approved' AND paymentStatus = 'Successful'
       ORDER BY id DESC
       LIMIT 1`,
      [doctorUsername, patientUsername]
    ),
};

module.exports = chatRepository;
