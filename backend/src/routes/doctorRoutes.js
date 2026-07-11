"use strict";

const express = require("express");
const router = express.Router();
const doctorService = require("../services/doctorService");
const asyncHandler = require("../utils/asyncHandler");

// Doctor API: Update Clinic Details
router.post("/doctors/clinic-details", asyncHandler(async (req, res) => {
  const { id, clinicTiming, clinicAddress, consultationAvailability } = req.body;
  const result = await doctorService.updateClinicDetails(id, { clinicTiming, clinicAddress, consultationAvailability });
  return res.json(result);
}));

// Doctor API: Update Availability Slots
router.post("/doctors/slots", asyncHandler(async (req, res) => {
  const { id, slots } = req.body;
  const result = await doctorService.updateSlots(id, slots);
  return res.json(result);
}));

// Doctor API: Get Details
router.get("/doctors/:id", asyncHandler(async (req, res) => {
  const doctor = await doctorService.getDoctorById(req.params.id);
  if (doctor) return res.json(doctor);
  return res.json({ error: "Doctor not found" });
}));

// Doctor API: Update Specialization
router.post("/doctors/update-specialization", asyncHandler(async (req, res) => {
  const { id, specialization } = req.body;
  const result = await doctorService.updateSpecialization(id, specialization);
  return res.json(result);
}));

// Public / User Directory APIs: Get All Approved Doctors
router.get("/public/doctors", asyncHandler(async (req, res) => {
  const rows = await doctorService.getApprovedDoctors();
  return res.json(rows);
}));

module.exports = router;
