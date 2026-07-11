"use strict";

const doctorService = require("../services/doctorService");
const asyncHandler = require("../utils/asyncHandler");

const doctorController = {
  /**
   * Update doctor's clinic details
   */
  updateClinicDetails: asyncHandler(async (req, res) => {
    const { id, clinicTiming, clinicAddress, consultationAvailability } = req.body;
    const result = await doctorService.updateClinicDetails(id, { clinicTiming, clinicAddress, consultationAvailability });
    return res.json(result);
  }),

  /**
   * Update doctor's availability slots
   */
  updateSlots: asyncHandler(async (req, res) => {
    const { id, slots } = req.body;
    const result = await doctorService.updateSlots(id, slots);
    return res.json(result);
  }),

  /**
   * Get doctor profile details by ID
   */
  getDoctorById: asyncHandler(async (req, res) => {
    const doctor = await doctorService.getDoctorById(req.params.id);
    if (!doctor) return res.json({ error: "Doctor not found" });
    return res.json(doctor);
  }),

  /**
   * Update doctor specialization field
   */
  updateSpecialization: asyncHandler(async (req, res) => {
    const { id, specialization } = req.body;
    const result = await doctorService.updateSpecialization(id, specialization);
    return res.json(result);
  }),

  /**
   * Get all approved doctors for the public directory listing
   */
  getApprovedDoctors: asyncHandler(async (req, res) => {
    const rows = await doctorService.getApprovedDoctors();
    return res.json(rows);
  })
};

module.exports = doctorController;
