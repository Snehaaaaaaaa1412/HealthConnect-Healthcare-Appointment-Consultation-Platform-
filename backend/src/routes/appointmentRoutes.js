"use strict";

const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const upload = require("../middleware/uploadMiddleware");
const validate = require("../middleware/validationMiddleware");

// Validation Schemas
const bookAppointmentSchema = {
  patientUsername: { required: true, minLength: 3 },
  patientFullName: { required: true, minLength: 3 },
  doctorUsername: { required: true, minLength: 3 },
  doctorFullName: { required: true, minLength: 3 },
  specialization: { required: true },
  slot: { required: true },
  fee: { required: true }
};

const apptIdSchema = {
  appointmentId: { required: true, type: "number" }
};

const prescribeSchema = {
  appointmentId: { required: true, type: "number" },
  drug: { required: true, minLength: 2 },
  dosage: { required: true },
  times: { required: true }
};

// Appointment booking endpoint (transactional lock, optional medical report upload)
router.post("/appointments/book", upload.single("medicalReport"), validate(bookAppointmentSchema), appointmentController.bookAppointment);

// Approve appointment endpoint (returns details for confirmation email)
router.post("/appointments/approve", validate(apptIdSchema), appointmentController.approveAppointment);

// Cancel appointment endpoint (with slot release)
router.post("/appointments/cancel", validate(apptIdSchema), appointmentController.cancelAppointment);

// Payment completion endpoint
router.post("/appointments/pay", validate(apptIdSchema), appointmentController.payAppointment);

// Get patient appointments
router.get("/appointments/patient/:username", appointmentController.getPatientAppointments);

// Get doctor appointments
router.get("/appointments/doctor/:username", appointmentController.getDoctorAppointments);

// Submit prescription for an appointment (triggers escrow payout)
router.post("/appointments/prescribe", validate(prescribeSchema), appointmentController.prescribeAppointment);

module.exports = router;
