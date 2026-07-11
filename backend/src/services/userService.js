"use strict";

/**
 * User Service — Patient Domain
 *
 * Responsibility:
 *   Business logic for patient (user) registration, authentication,
 *   and profile retrieval. This is the ONLY layer that calls
 *   userRepository. Route handlers call this service; they do NOT
 *   touch the database directly.
 *
 * Runtime call path:
 *   server.js route handler
 *       → userService (this file)
 *           → userRepository
 *               → SQLite (via dbHelpers)
 *
 * Design decisions:
 *   - loginUser() fetches the user row and compares the password in
 *     JavaScript, not in SQL. This is intentionally bcrypt-ready:
 *     when Milestone 13 adds hashing, only this method changes —
 *     the repository and route handler stay untouched.
 *
 *   - registerUser() wraps the UNIQUE constraint error from SQLite
 *     into a typed application error so the route handler does not
 *     need to inspect raw SQLite error messages.
 *
 *   - No HTTP objects (req, res) enter this file. Services are
 *     framework-agnostic by design.
 */

const userRepository = require("../repositories/userRepository");
const bcrypt = require("bcryptjs");

const userService = {
  /**
   * Register a new patient account.
   *
   * @param {{ fullName, username, password, mobile, email, gender, age }} data
   * @returns {Promise<{ message: string }>}
   * @throws {{ isUniqueViolation: true }} if username is already taken
   */
  registerUser: async ({ fullName, username, password, mobile, email, gender, age }) => {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      await userRepository.create({ fullName, username, password: hashedPassword, mobile, email, gender, age });
      return { message: "User registered successfully" };
    } catch (err) {
      if (err.message && err.message.includes("UNIQUE")) {
        const uniqueErr = new Error("Username is already taken");
        uniqueErr.isUniqueViolation = true;
        throw uniqueErr;
      }
      throw err;
    }
  },

  /**
   * Authenticate a patient by username and plaintext password.
   *
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Object|null>} Cleaned user object (no password), or null if invalid
   */
  loginUser: async (username, password) => {
    const user = await userRepository.findByUsername(username);
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;
    const { password: _, ...cleanUser } = user;
    return cleanUser;
  },

  /**
   * Retrieve a patient's public profile by username.
   *
   * @param {string} username
   * @returns {Promise<Object|null>} Public profile (no password), or null if not found
   */
  getUserByUsername: async (username) => {
    return userRepository.findByUsernamePublic(username);
  },
};

module.exports = userService;
