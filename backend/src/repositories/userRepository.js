"use strict";

/**
 * User Repository
 *
 * Responsibility:
 *   All database operations for the `users` table.
 *   This is the ONLY file that issues SQL against `users`.
 *
 * Design decisions:
 *   - findByUsername() does NOT include a password filter.
 *     Password comparison (bcrypt) is intentionally left to the
 *     service layer. This makes the repository bcrypt-ready without
 *     any change needed here when Milestone 13 implements hashing.
 *
 *   - All methods return Promises, enabling async/await in services.
 *
 *   - No business logic lives here. No HTTP req/res. No error handling
 *     beyond propagating DB errors to the caller.
 */

const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");

const userRepository = {
  /**
   * Find a user by their username.
   * Returns the full row including hashed password (for service-layer comparison).
   * Returns null if not found.
   *
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  findByUsername: (username) =>
    dbGet("SELECT * FROM users WHERE username = ?", [username]),

  /**
   * Find a user's public profile (password excluded).
   * Used by the profile endpoint and chat context.
   *
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  findByUsernamePublic: (username) =>
    dbGet(
      "SELECT id, fullName, username, email, mobile, gender, age FROM users WHERE username = ?",
      [username]
    ),

  /**
   * Find a user by primary key.
   *
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findById: (id) =>
    dbGet(
      "SELECT id, fullName, username, email, mobile, gender, age FROM users WHERE id = ?",
      [id]
    ),

  /**
   * Insert a new patient user record.
   * Returns { lastID } — the new user's primary key.
   *
   * @param {{ fullName, username, password, mobile, email, gender, age }} data
   * @returns {Promise<{ lastID: number, changes: number }>}
   */
  create: ({ fullName, username, password, mobile, email, gender, age }) =>
    dbRun(
      `INSERT INTO users (fullName, username, password, mobile, email, gender, age)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName,
        username,
        password,
        mobile,
        email,
        gender || "Unspecified",
        age ? parseInt(age, 10) : null,
      ]
    ),
};

module.exports = userRepository;
