"use strict";

/**
 * Doctor Repository
 *
 * Responsibility:
 *   All database operations for the `doctors` table.
 *   This is the ONLY file that issues SQL against `doctors`.
 *
 * Design decisions:
 *   - findByUsername() does NOT filter by password.
 *     Credential comparison belongs in the service layer (bcrypt-ready).
 *
 *   - findAllApproved() selects only safe, public-facing columns.
 *     The password column is never returned by any read method.
 *
 *   - incrementBalance() uses `balance = balance + ?` (not SET balance = ?)
 *     to avoid a read-modify-write race condition for concurrent payouts.
 */

const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");

const doctorRepository = {
  /**
   * Find a doctor by username (full row, including password for auth).
   *
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  findByUsername: (username) =>
    dbGet("SELECT * FROM doctors WHERE username = ?", [username]),

  /**
   * Find a doctor by primary key.
   * Returns full row minus password — used by the public doctor detail endpoint.
   *
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findById: (id) =>
    dbGet("SELECT * FROM doctors WHERE id = ?", [id]),

  /**
   * All approved doctors — public-facing columns only.
   * Password, internal status, and balance are excluded.
   *
   * @returns {Promise<Array>}
   */
  findAllApproved: () =>
    dbAll(
      `SELECT id, fullName, username, specialization, email, mobile,
              slots, clinicTiming, clinicAddress, consultationAvailability
       FROM doctors
       WHERE status = 'approved'`,
      []
    ),

  /**
   * All doctors — admin-facing columns (status + balance visible).
   * Password is still excluded.
   *
   * @returns {Promise<Array>}
   */
  findAllForAdmin: () =>
    dbAll(
      "SELECT id, fullName, username, mobile, email, specialization, status, balance FROM doctors",
      []
    ),

  /**
   * Insert a new doctor record (pending approval by default).
   *
   * @param {{ fullName, username, password, mobile, email, specialization }} data
   * @returns {Promise<{ lastID: number, changes: number }>}
   */
  create: ({ fullName, username, password, mobile, email, specialization }) =>
    dbRun(
      `INSERT INTO doctors (fullName, username, password, mobile, email, specialization)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, username, password, mobile, email, specialization || "General Practitioner"]
    ),

  /**
   * Replace the available appointment slots for a doctor.
   * slotsJson is a JSON stringified array: '[{"id":"...", "datetime":"...", "fee":500}]'
   *
   * @param {number} id
   * @param {string} slotsJson
   * @returns {Promise<{ changes: number }>}
   */
  updateSlots: (id, slotsJson) =>
    dbRun("UPDATE doctors SET slots = ? WHERE id = ?", [slotsJson, id]),

  /**
   * Update clinic contact and availability information.
   *
   * @param {number} id
   * @param {{ clinicTiming, clinicAddress, consultationAvailability }} data
   * @returns {Promise<{ changes: number }>}
   */
  updateClinicDetails: (id, { clinicTiming, clinicAddress, consultationAvailability }) =>
    dbRun(
      "UPDATE doctors SET clinicTiming = ?, clinicAddress = ?, consultationAvailability = ? WHERE id = ?",
      [clinicTiming || "", clinicAddress || "", consultationAvailability || "", id]
    ),

  /**
   * Update a doctor's medical specialization.
   *
   * @param {number} id
   * @param {string} specialization
   * @returns {Promise<{ changes: number }>}
   */
  updateSpecialization: (id, specialization) =>
    dbRun(
      "UPDATE doctors SET specialization = ? WHERE id = ?",
      [specialization, id]
    ),

  /**
   * Credit the escrow payout amount to a doctor's wallet balance.
   * Uses an atomic increment — never reads balance before writing.
   *
   * @param {string} username
   * @param {number} amount
   * @returns {Promise<{ changes: number }>}
   */
  incrementBalance: (username, amount) =>
    dbRun(
      "UPDATE doctors SET balance = balance + ? WHERE username = ?",
      [amount, username]
    ),

  /**
   * Admin: set a doctor's status to 'approved'.
   *
   * @param {number} id
   * @returns {Promise<{ changes: number }>}
   */
  approve: (id) =>
    dbRun("UPDATE doctors SET status = 'approved' WHERE id = ?", [id]),

  /**
   * Admin: permanently remove a doctor account.
   *
   * @param {number} id
   * @returns {Promise<{ changes: number }>}
   */
  remove: (id) =>
    dbRun("DELETE FROM doctors WHERE id = ?", [id]),
};

module.exports = doctorRepository;
