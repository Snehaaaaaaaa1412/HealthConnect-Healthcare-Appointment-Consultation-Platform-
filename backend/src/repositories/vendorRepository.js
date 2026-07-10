"use strict";

/**
 * Vendor Repository
 *
 * Responsibility:
 *   All database operations for the `vendors` table.
 *   This is the ONLY file that issues SQL against `vendors`.
 *
 * Design decisions:
 *   - incrementBalance() uses `balance = balance + ?` (atomic increment)
 *     to safely handle the 90% vendor payout from the order total
 *     without a race condition.
 *
 *   - updateInventory() accepts a JSON string (already serialized by
 *     the service layer before calling the repository).
 *
 *   - findByUsername() returns the full row including password
 *     for the service layer to perform credential verification.
 */

const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");

const vendorRepository = {
  /**
   * Find a vendor by username (full row including password for auth).
   *
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  findByUsername: (username) =>
    dbGet("SELECT * FROM vendors WHERE username = ?", [username]),

  /**
   * Find a vendor by primary key (full row for vendor dashboard).
   *
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findById: (id) =>
    dbGet("SELECT * FROM vendors WHERE id = ?", [id]),

  /**
   * All approved vendors — public-facing columns only.
   * Password and balance are excluded.
   *
   * @returns {Promise<Array>}
   */
  findAllApproved: () =>
    dbAll(
      "SELECT id, fullName, storeName, email, mobile, inventory FROM vendors WHERE status = 'approved'",
      []
    ),

  /**
   * All vendors — admin-facing columns (status + balance visible).
   * Password is excluded.
   *
   * @returns {Promise<Array>}
   */
  findAllForAdmin: () =>
    dbAll(
      "SELECT id, fullName, username, mobile, email, storeName, status, balance FROM vendors",
      []
    ),

  /**
   * Insert a new vendor (pharmacy store) record.
   * Status defaults to 'pending' via the DB schema — requires admin approval.
   *
   * @param {{ fullName, username, password, mobile, email, storeName }} data
   * @returns {Promise<{ lastID: number, changes: number }>}
   */
  create: ({ fullName, username, password, mobile, email, storeName }) =>
    dbRun(
      `INSERT INTO vendors (fullName, username, password, mobile, email, storeName)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, username, password, mobile, email, storeName || "Health Pharmacy"]
    ),

  /**
   * Replace a vendor's full inventory JSON.
   * The service layer serializes the inventory array before calling this.
   *
   * @param {number} id
   * @param {string} inventoryJson
   * @returns {Promise<{ changes: number }>}
   */
  updateInventory: (id, inventoryJson) =>
    dbRun("UPDATE vendors SET inventory = ? WHERE id = ?", [inventoryJson, id]),

  /**
   * Credit the vendor's wallet with a split payment amount.
   * Uses atomic increment — no read-before-write.
   *
   * @param {number} id
   * @param {number} amount - 90% of the order total
   * @returns {Promise<{ changes: number }>}
   */
  incrementBalance: (id, amount) =>
    dbRun("UPDATE vendors SET balance = balance + ? WHERE id = ?", [amount, id]),

  /**
   * Admin: set a vendor's status to 'approved'.
   *
   * @param {number} id
   * @returns {Promise<{ changes: number }>}
   */
  approve: (id) =>
    dbRun("UPDATE vendors SET status = 'approved' WHERE id = ?", [id]),

  /**
   * Admin: permanently remove a vendor account.
   *
   * @param {number} id
   * @returns {Promise<{ changes: number }>}
   */
  remove: (id) =>
    dbRun("DELETE FROM vendors WHERE id = ?", [id]),
};

module.exports = vendorRepository;
