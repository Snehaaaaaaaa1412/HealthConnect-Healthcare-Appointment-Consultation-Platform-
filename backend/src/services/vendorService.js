"use strict";

/**
 * Vendor Service
 *
 * Responsibility:
 *   All business logic for the vendor (pharmacy) domain.
 *   The ONLY layer that calls vendorRepository and medicineRepository.
 *   Route handlers call this service; they never touch the database directly.
 *
 * Runtime call path:
 *   server.js route handler
 *       → vendorService (this file)
 *           → vendorRepository  → SQLite
 *           → medicineRepository → SQLite  (for inventory sync)
 *
 * Design decisions:
 *   - loginVendor() fetches by username then compares password in JS.
 *     Bcrypt-ready: only this line changes in Milestone 13.
 *
 *   - updateInventory() orchestrates two repositories:
 *       1. Sync new medicine names to the global catalog (medicineRepository)
 *       2. Persist the vendor's full inventory JSON (vendorRepository)
 *     This mirrors the original server.js behaviour exactly — the inventory
 *     update always runs before the medicine sync, consistent with what
 *     the frontend expects.
 *
 *   - No req/res objects enter this file.
 *   - No SQL strings exist in this file.
 */

const vendorRepository  = require("../repositories/vendorRepository");
const medicineRepository = require("../repositories/medicineRepository");

const vendorService = {

  // ── Authentication ──────────────────────────────────────────────────────

  /**
   * Register a new vendor account.
   * @param {{ fullName, username, password, mobile, email, storeName }} data
   * @returns {Promise<{ message: string }>}
   * @throws {{ isUniqueViolation: true }} if username already taken
   */
  registerVendor: async ({ fullName, username, password, mobile, email, storeName }) => {
    try {
      await vendorRepository.create({ fullName, username, password, mobile, email, storeName });
      return { message: "User registered successfully" };
    } catch (err) {
      if (err.message && err.message.includes("UNIQUE")) {
        const e = new Error("Username is already taken");
        e.isUniqueViolation = true;
        throw e;
      }
      throw err;
    }
  },

  /**
   * Authenticate a vendor by username and plaintext password.
   * Returns cleaned vendor object (password stripped) or null if invalid.
   * NOTE: TODO M13 — replace line below with bcrypt.compare()
   *
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Object|null>}
   */
  loginVendor: async (username, password) => {
    const vendor = await vendorRepository.findByUsername(username);
    if (!vendor || vendor.password !== password) return null; // TODO M13: bcrypt.compare()
    const { password: _, ...cleanVendor } = vendor;
    return cleanVendor;
  },

  // ── Vendor Profile ──────────────────────────────────────────────────────

  /**
   * Get a vendor's full profile (password stripped) by primary key.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  getVendorById: async (id) => {
    const vendor = await vendorRepository.findById(id);
    if (!vendor) return null;
    const { password: _, ...cleanVendor } = vendor;
    return cleanVendor;
  },

  /**
   * Get all approved vendors — public-facing columns only.
   * @returns {Promise<Array>}
   */
  getApprovedVendors: async () => {
    return vendorRepository.findAllApproved();
  },

  // ── Inventory ───────────────────────────────────────────────────────────

  /**
   * Update a vendor's inventory and sync new medicines to the global catalog.
   *
   * Business rules (preserved from original server.js):
   *   1. Persist the inventory JSON to the vendor record.
   *   2. For every item in the inventory that has a name, insert it into
   *      the medicine catalog using INSERT OR IGNORE (idempotent).
   *   3. Items without a name are silently skipped.
   *   4. Medicine sync failure is logged but does NOT fail the inventory update.
   *
   * @param {number} id        - Vendor primary key
   * @param {Array}  inventory - Raw inventory array from the request body
   * @returns {Promise<{ message: string }>}
   */
  updateInventory: async (id, inventory) => {
    // 1. Persist inventory to vendor record
    const items = typeof inventory === "string" ? JSON.parse(inventory) : inventory;
    await vendorRepository.updateInventory(id, JSON.stringify(items));

    // 2. Sync medicines to global catalog
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item && item.name) {
          try {
            await medicineRepository.insertOrIgnore(item.name, item.domain || "General Practitioner");
          } catch (e) {
            console.error("Failed to sync medicine to catalog:", e);
          }
        }
      }
    }

    return { message: "Inventory updated successfully" };
  },

  // ── Admin Operations ────────────────────────────────────────────────────

  /**
   * Get all vendor accounts with admin-visible fields (status, balance).
   * @returns {Promise<Array>}
   */
  getAllForAdmin: async () => {
    return vendorRepository.findAllForAdmin();
  },

  /**
   * Approve a vendor account. Sets status to 'approved'.
   * @param {number} id
   * @returns {Promise<{ message: string }>}
   */
  approveVendor: async (id) => {
    await vendorRepository.approve(id);
    return { message: "Vendor approved successfully" };
  },

  /**
   * Permanently remove a vendor account.
   * @param {number} id
   * @returns {Promise<{ message: string }>}
   */
  deleteVendor: async (id) => {
    await vendorRepository.remove(id);
    return { message: "Vendor removed successfully" };
  },
};

module.exports = vendorService;
