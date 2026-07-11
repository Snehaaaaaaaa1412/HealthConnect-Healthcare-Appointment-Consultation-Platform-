"use strict";

const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const upload = require("../middleware/uploadMiddleware");

// Appointment booking endpoint (transactional lock, optional medical report upload)
router.post("/appointments/book", upload.single("medicalReport"), appointmentController.bookAppointment);

// Approve appointment endpoint (returns details for confirmation email)
router.post("/appointments/approve", appointmentController.approveAppointment);

// Cancel appointment endpoint (with slot release)
router.post("/appointments/cancel", appointmentController.cancelAppointment);

// Payment completion endpoint
router.post("/appointments/pay", appointmentController.payAppointment);

// Get patient appointments
router.get("/appointments/patient/:username", appointmentController.getPatientAppointments);

// Get doctor appointments
router.get("/appointments/doctor/:username", appointmentController.getDoctorAppointments);

// Submit prescription for an appointment (triggers escrow payout)
router.post("/appointments/prescribe", appointmentController.prescribeAppointment);

module.exports = router;
