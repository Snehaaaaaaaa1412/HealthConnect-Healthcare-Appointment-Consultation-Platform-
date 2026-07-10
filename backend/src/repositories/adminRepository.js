"use strict";

/**
 * Admin Repository
 *
 * Responsibility:
 *   All database operations for admin-specific statistics and analytics
 *   dashboards. These queries span multiple tables and exist purely for
 *   reporting — they do not fit neatly into any single entity repository.
 *
 * Design decisions:
 *   - Statistics queries (COUNT) are separate from analytics queries
 *     (GROUP BY, SUM) for clarity and single-responsibility.
 *
 *   - getTotalOrderAmount() uses OR rather than IN for the status filter
 *     to exactly match the original server.js query behaviour. This
 *     preserves the existing business rule: only 'Received' and 'Dispatched'
 *     orders count toward platform revenue.
 *
 *   - No INSERT/UPDATE/DELETE here — admin data modification (approve,
 *     delete) belongs in the entity-specific repositories.
 */

const { dbGet, dbAll } = require("../utils/dbHelpers");

const adminRepository = {
  // ────────────────────────────────────────────────────────────
  // Dashboard Statistics
  // ────────────────────────────────────────────────────────────

  /**
   * Total number of registered patient accounts.
   * @returns {Promise<{ count: number }>}
   */
  getUserCount: () =>
    dbGet("SELECT COUNT(*) as count FROM users", []),

  /**
   * Total number of registered doctor accounts (any status).
   * @returns {Promise<{ count: number }>}
   */
  getDoctorCount: () =>
    dbGet("SELECT COUNT(*) as count FROM doctors", []),

  /**
   * Total number of registered vendor (pharmacy) accounts (any status).
   * @returns {Promise<{ count: number }>}
   */
  getVendorCount: () =>
    dbGet("SELECT COUNT(*) as count FROM vendors", []),

  // ────────────────────────────────────────────────────────────
  // Analytics Dashboard
  // ────────────────────────────────────────────────────────────

  /**
   * Appointment breakdown by booking status (pending / approved / cancelled).
   * @returns {Promise<Array<{ status: string, count: number }>>}
   */
  getAppointmentsByStatus: () =>
    dbAll(
      "SELECT status, COUNT(*) as count FROM appointments GROUP BY status",
      []
    ),

  /**
   * Appointment breakdown by payment status (unpaid / Successful).
   * @returns {Promise<Array<{ paymentStatus: string, count: number }>>}
   */
  getAppointmentsByPaymentStatus: () =>
    dbAll(
      "SELECT paymentStatus, COUNT(*) as count FROM appointments GROUP BY paymentStatus",
      []
    ),

  /**
   * Order breakdown by fulfilment status (Pending / Dispatched / Received).
   * @returns {Promise<Array<{ status: string, count: number }>>}
   */
  getOrdersByStatus: () =>
    dbAll(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status",
      []
    ),

  /**
   * Total platform consultation revenue from successfully paid appointments.
   * @returns {Promise<{ totalConsultFee: number|null }>}
   */
  getTotalConsultationFees: () =>
    dbGet(
      "SELECT SUM(fee) as totalConsultFee FROM appointments WHERE paymentStatus = 'Successful'",
      []
    ),

  /**
   * Total pharmacy order value from dispatched and received orders.
   * Used to compute the platform's 10% commission on order flow.
   *
   * @returns {Promise<{ totalOrderAmount: number|null }>}
   */
  getTotalOrderAmount: () =>
    dbGet(
      `SELECT SUM(totalAmount) as totalOrderAmount
       FROM orders
       WHERE status = 'Received' OR status = 'Dispatched'`,
      []
    ),
};

module.exports = adminRepository;
