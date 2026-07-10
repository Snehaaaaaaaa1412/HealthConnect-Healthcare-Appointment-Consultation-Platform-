"use strict";

/**
 * Medicine Repository
 *
 * Responsibility:
 *   All database operations for the `medicine` table.
 *   This is the ONLY file that issues SQL against `medicine`.
 *
 * Design decisions:
 *   - insertOrIgnore() uses INSERT OR IGNORE to handle the case where
 *     a vendor adds an existing medicine name to their inventory.
 *     This prevents duplicate key errors without needing a prior SELECT.
 *     It is called both during vendor inventory updates and at DB seed time.
 *
 *   - findByDomain() enables the prescription autocomplete feature —
 *     the doctor dashboard can fetch only the medicines relevant to
 *     their specialization.
 */

const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");

const medicineRepository = {
  /**
   * Retrieve all medicines from the catalog, sorted by domain then name.
   *
   * @returns {Promise<Array>}
   */
  findAll: () =>
    dbAll("SELECT * FROM medicine ORDER BY domain, name", []),

  /**
   * Retrieve all medicines for a specific medical domain (specialization).
   * Used to filter the prescription dropdown by doctor's specialty.
   *
   * @param {string} domain - e.g. "Cardiology", "Pediatrics"
   * @returns {Promise<Array>}
   */
  findByDomain: (domain) =>
    dbAll("SELECT * FROM medicine WHERE domain = ? ORDER BY name", [domain]),

  /**
   * Add a medicine to the catalog.
   * INSERT OR IGNORE — safely skips the insert if the medicine name
   * already exists (UNIQUE constraint on `name` column).
   *
   * @param {string} name
   * @param {string} domain - Medical specialization domain
   * @returns {Promise<{ lastID: number, changes: number }>}
   */
  insertOrIgnore: (name, domain) =>
    dbRun(
      "INSERT OR IGNORE INTO medicine (name, domain) VALUES (?, ?)",
      [name, domain || "General Practitioner"]
    ),
};

module.exports = medicineRepository;
