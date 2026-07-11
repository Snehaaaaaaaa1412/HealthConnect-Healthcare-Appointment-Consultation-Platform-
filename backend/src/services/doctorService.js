"use strict";

/**
 * Doctor Service
 *
 * Responsibility:
 *   All business logic for the doctor domain.
 *   The ONLY layer that calls doctorRepository.
 *   Route handlers call this service; they never touch the database directly.
 *
 * Runtime call path:
 *   server.js route handler
 *       → doctorService (this file)
 *           → doctorRepository
 *               → SQLite (via dbHelpers)
 */

const doctorRepository = require("../repositories/doctorRepository");
const bcrypt = require("bcryptjs");

const doctorService = {

  // ── Authentication ──────────────────────────────────────────────────────

  /**
   * Register a new doctor account.
   * @param {{ fullName, username, password, mobile, email, specialization }} data
   * @returns {Promise<{ message: string }>}
   * @throws {{ isUniqueViolation: true }} if username already taken
   */
  registerDoctor: async ({ fullName, username, password, mobile, email, specialization }) => {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      await doctorRepository.create({ fullName, username, password: hashedPassword, mobile, email, specialization });
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
   * Authenticate a doctor by username and plaintext password.
   * Returns cleaned doctor object (password stripped) or null if invalid.
   *
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Object|null>}
   */
  loginDoctor: async (username, password) => {
    const doctor = await doctorRepository.findByUsername(username);
    if (!doctor) return null;
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) return null;
    const { password: _, ...cleanDoctor } = doctor;
    return cleanDoctor;
  },

  // ── Doctor Profile & Details ────────────────────────────────────────────

  /**
   * Get a doctor's full profile (password stripped) by primary key.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  getDoctorById: async (id) => {
    const doctor = await doctorRepository.findById(id);
    if (!doctor) return null;
    const { password: _, ...cleanDoctor } = doctor;
    return cleanDoctor;
  },

  /**
   * Get all approved doctors — public-facing columns only.
   * @returns {Promise<Array>}
   */
  getApprovedDoctors: async () => {
    return doctorRepository.findAllApproved();
  },

  /**
   * Update clinic contact and availability details.
   * @param {number} id
   * @param {{ clinicTiming, clinicAddress, consultationAvailability }} details
   * @returns {Promise<{ message: string }>}
   */
  updateClinicDetails: async (id, { clinicTiming, clinicAddress, consultationAvailability }) => {
    await doctorRepository.updateClinicDetails(id, { clinicTiming, clinicAddress, consultationAvailability });
    return { message: "Clinic details updated successfully" };
  },

  /**
   * Update available slots for appointments.
   * @param {number} id
   * @param {Array|string} slots - Slots representation
   * @returns {Promise<{ message: string }>}
   */
  updateSlots: async (id, slots) => {
    const slotsJson = typeof slots === "string" ? slots : JSON.stringify(slots);
    await doctorRepository.updateSlots(id, slotsJson);
    return { message: "Slots updated successfully" };
  },

  /**
   * Update doctor's specialization.
   * @param {number} id
   * @param {string} specialization
   * @returns {Promise<{ message: string }>}
   */
  updateSpecialization: async (id, specialization) => {
    await doctorRepository.updateSpecialization(id, specialization);
    return { message: "Specialization updated successfully" };
  },

  // ── Admin Operations ────────────────────────────────────────────────────

  /**
   * Get all doctors with admin-visible fields (status, balance).
   * @returns {Promise<Array>}
   */
  getAllForAdmin: async () => {
    return doctorRepository.findAllForAdmin();
  },

  /**
   * Approve a doctor account. Sets status to 'approved'.
   * @param {number} id
   * @returns {Promise<{ message: string }>}
   */
  approveDoctor: async (id) => {
    await doctorRepository.approve(id);
    return { message: "Doctor approved successfully" };
  },

  /**
   * Permanently remove a doctor account.
   * @param {number} id
   * @returns {Promise<{ message: string }>}
   */
  deleteDoctor: async (id) => {
    await doctorRepository.remove(id);
    return { message: "Doctor removed successfully" };
  },
};

module.exports = doctorService;
