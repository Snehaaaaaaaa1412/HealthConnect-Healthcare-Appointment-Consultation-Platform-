"use strict";

/**
 * Appointment Repository
 *
 * Responsibility:
 *   All database operations for the `appointments` table.
 *   This is the ONLY file that issues SQL against `appointments`.
 *
 * Design decisions:
 *   - TRANSACTION MANAGEMENT is intentionally NOT here.
 *     The appointment booking flow (BEGIN IMMEDIATE TRANSACTION →
 *     SELECT slots → INSERT appointment → UPDATE doctor slots → COMMIT)
 *     is orchestrated by the service layer using the db singleton from
 *     src/config/database. Individual repository methods are designed
 *     to work both inside and outside transaction boundaries.
 *
 *   - create() uses individual parameters rather than a spread to make
 *     the SQL column mapping explicit and prevent column order bugs.
 *
 *   - findExpiredLocks() is used by the background cleanup interval
 *     that releases unpaid appointment slot-locks after 10 minutes.
 *
 *   - Separate update methods (updateStatus, updatePaymentStatus,
 *     updateEscrowStatus, updatePrescription) follow the single-
 *     responsibility principle — each changes exactly one concern.
 */

const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");

const appointmentRepository = {
  /**
   * Find a single appointment by primary key.
   *
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findById: (id) =>
    dbGet("SELECT * FROM appointments WHERE id = ?", [id]),

  /**
   * All appointments for a specific patient, newest first.
   *
   * @param {string} username
   * @returns {Promise<Array>}
   */
  findByPatient: (username) =>
    dbAll(
      "SELECT * FROM appointments WHERE patientUsername = ? ORDER BY id DESC",
      [username]
    ),

  /**
   * All appointments for a specific doctor, newest first.
   *
   * @param {string} username
   * @returns {Promise<Array>}
   */
  findByDoctor: (username) =>
    dbAll(
      "SELECT * FROM appointments WHERE doctorUsername = ? ORDER BY id DESC",
      [username]
    ),

  /**
   * Find all unpaid appointments whose lease-lock has expired (> 10 minutes old).
   * Used by the background cleanup worker that runs every 30 seconds.
   *
   * @returns {Promise<Array>}
   */
  findExpiredLocks: () =>
    dbAll(
      `SELECT * FROM appointments
       WHERE paymentStatus = 'unpaid'
         AND status = 'pending'
         AND datetime(createdAt) < datetime('now', '-10 minutes')`,
      []
    ),

  /**
   * Insert a new appointment record.
   * The calling service is responsible for wrapping this in a
   * BEGIN IMMEDIATE TRANSACTION to prevent double-booking.
   *
   * @param {{ patientUsername, patientFullName, doctorUsername, doctorFullName,
   *            specialization, slot, symptoms, fee, medicalReportPath }} data
   * @returns {Promise<{ lastID: number, changes: number }>}
   */
  create: (data) =>
    dbRun(
      `INSERT INTO appointments
         (patientUsername, patientFullName, doctorUsername, doctorFullName,
          specialization, slot, symptoms, fee,
          status, paymentStatus, escrowStatus, medicalReportPath)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', 'held', ?)`,
      [
        data.patientUsername,
        data.patientFullName,
        data.doctorUsername,
        data.doctorFullName,
        data.specialization,
        data.slot,
        data.symptoms,
        data.fee,
        data.medicalReportPath || "",
      ]
    ),

  /**
   * Update the booking status ('pending' | 'approved' | 'cancelled').
   *
   * @param {number} id
   * @param {string} status
   * @returns {Promise<{ changes: number }>}
   */
  updateStatus: (id, status) =>
    dbRun("UPDATE appointments SET status = ? WHERE id = ?", [status, id]),

  /**
   * Update the payment status ('unpaid' | 'Successful').
   *
   * @param {number} id
   * @param {string} paymentStatus
   * @returns {Promise<{ changes: number }>}
   */
  updatePaymentStatus: (id, paymentStatus) =>
    dbRun("UPDATE appointments SET paymentStatus = ? WHERE id = ?", [paymentStatus, id]),

  /**
   * Write the doctor's prescription for a completed appointment.
   *
   * @param {number} id
   * @param {{ drug, dosage, times }} data
   * @returns {Promise<{ changes: number }>}
   */
  updatePrescription: (id, { drug, dosage, times }) =>
    dbRun(
      `UPDATE appointments
       SET prescriptionDrug = ?, prescriptionDosage = ?, prescriptionRegimen = ?
       WHERE id = ?`,
      [drug, dosage, times, id]
    ),

  /**
   * Update the escrow status ('held' | 'released').
   * Set to 'released' after the doctor writes a prescription and
   * the fee is transferred to the doctor's balance.
   *
   * @param {number} id
   * @param {string} escrowStatus
   * @returns {Promise<{ changes: number }>}
   */
  updateEscrowStatus: (id, escrowStatus) =>
    dbRun(
      "UPDATE appointments SET escrowStatus = ? WHERE id = ?",
      [escrowStatus, id]
    ),
};

module.exports = appointmentRepository;
