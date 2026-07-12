"use strict";

/**
 * Order Repository
 *
 * Responsibility:
 *   All database operations for the `orders` table.
 *   This is the ONLY file that issues SQL against `orders`.
 *
 * Design decisions:
 *   - create() accepts raw data and JSON-stringifies items here.
 *     The service layer passes the raw items array — serialization
 *     is the repository's responsibility since it knows the DB schema.
 *
 *   - TRANSACTION MANAGEMENT is not here. The order creation flow
 *     (INSERT order + UPDATE vendor balance) is an atomic operation
 *     managed by the service layer using BEGIN IMMEDIATE TRANSACTION.
 *
 *   - updateStatus() is a single method for all status transitions
 *     ('Pending' → 'Dispatched' → 'Received') rather than three
 *     separate methods, since the SQL is identical.
 */

const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");

const orderRepository = {
  /**
   * Find a single order by primary key.
   *
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findById: (id) =>
    dbGet("SELECT * FROM orders WHERE id = ?", [id]),

  /**
   * All orders for a specific patient, newest first.
   *
   * @param {string} username
   * @returns {Promise<Array>}
   */
  findByPatient: (username) =>
    dbAll(
      "SELECT * FROM orders WHERE patientUsername = ? ORDER BY id DESC",
      [username]
    ),

  /**
   * All orders for a specific vendor, newest first.
   *
   * @param {number} vendorId
   * @returns {Promise<Array>}
   */
  findByVendor: (vendorId) =>
    dbAll(
      "SELECT * FROM orders WHERE vendorId = ? ORDER BY id DESC",
      [vendorId]
    ),

  /**
   * Insert a new pharmacy order.
   * items is accepted as an array and serialized to JSON here.
   * The service layer is responsible for wrapping this in a transaction
   * alongside the vendor balance update.
   *
   * @param {{ patientUsername, patientFullName, vendorId, vendorStoreName,
   *            vendorPhone, items, totalAmount, address }} data
   * @returns {Promise<{ lastID: number, changes: number }>}
   */
  create: (data) =>
    dbRun(
      `INSERT INTO orders
         (patientUsername, patientFullName, vendorId, vendorStoreName,
          vendorPhone, items, totalAmount, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        data.patientUsername,
        data.patientFullName,
        data.vendorId,
        data.vendorStoreName,
        data.vendorPhone,
        JSON.stringify(data.items),
        data.totalAmount,
        data.address,
      ]
    ),

  /**
   * Update the order status.
   * Valid transitions: 'Pending' → 'Dispatched' → 'Received'
   *
   * @param {number} id
   * @param {string} status
   * @returns {Promise<{ changes: number }>}
   */
  updateStatus: (id, status) =>
    dbRun("UPDATE orders SET status = ? WHERE id = ?", [status, id]),
};

module.exports = orderRepository;
