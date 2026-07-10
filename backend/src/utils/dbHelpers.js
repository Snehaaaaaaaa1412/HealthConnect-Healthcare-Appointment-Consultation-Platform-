"use strict";

/**
 * Database Helper Utilities — Promise wrappers for sqlite3
 *
 * WHY THIS EXISTS:
 *   sqlite3 for Node.js uses a callback-based API. Every repository
 *   function in this project needs to return a Promise so the service
 *   layer can use async/await cleanly without nested callbacks.
 *
 *   These three helpers are the ONLY place in the codebase that
 *   converts sqlite3 callbacks to Promises. All repository modules
 *   import from here — zero callback code leaks into business logic.
 *
 * USAGE (in any repository):
 *   const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");
 *
 *   const user = await dbGet("SELECT * FROM users WHERE id = ?", [id]);
 *   const rows  = await dbAll("SELECT * FROM users", []);
 *   const { lastID } = await dbRun("INSERT INTO users ...", [...]);
 *
 * TRANSACTION MANAGEMENT:
 *   Services that need atomic transactions should import db directly
 *   from src/config/database and use db.serialize() with BEGIN/COMMIT.
 *   Individual repository methods are designed to work both inside
 *   and outside transaction boundaries.
 */

const db = require("../config/database");

/**
 * Execute a SELECT that returns at most one row.
 * Resolves to the row object, or null if not found.
 *
 * @param {string} sql    - Parameterised SQL query
 * @param {Array}  params - Bound parameter values
 * @returns {Promise<Object|null>}
 */
const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });

/**
 * Execute a SELECT that returns multiple rows.
 * Resolves to an array (empty array if no rows found — never null).
 *
 * @param {string} sql    - Parameterised SQL query
 * @param {Array}  params - Bound parameter values
 * @returns {Promise<Array>}
 */
const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

/**
 * Execute an INSERT, UPDATE, or DELETE statement.
 * Resolves with { lastID, changes } — the ID of the last inserted row
 * and the number of rows affected.
 *
 * NOTE: Uses a regular function (not arrow function) for the callback
 * so `this.lastID` and `this.changes` are accessible from sqlite3's
 * Statement context.
 *
 * @param {string} sql    - Parameterised SQL statement
 * @param {Array}  params - Bound parameter values
 * @returns {Promise<{ lastID: number, changes: number }>}
 */
const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

module.exports = { dbGet, dbAll, dbRun };
