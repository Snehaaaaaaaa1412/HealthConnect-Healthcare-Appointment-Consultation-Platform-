"use strict";

const appointmentService = require("../services/appointmentService");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const appointmentController = {
  /**
   * Book a slot and create a pending appointment (transactional lock)
   */
  bookAppointment: asyncHandler(async (req, res) => {
    const {
      patientUsername,
      patientFullName,
      doctorUsername,
      doctorFullName,
      specialization,
      slot,
      symptoms,
      fee
    } = req.body;

    const result = await appointmentService.bookAppointment({
      patientUsername,
      patientFullName,
      doctorUsername,
      doctorFullName,
      specialization,
      slot,
      symptoms,
      fee,
      medicalReportPath: req.file ? `/uploads/medical_reports/${req.file.filename}` : ""
    });

    res.json(ApiResponse.success(null, result.message || "Appointment booked successfully"));
  }),

  /**
   * Approve doctor consultation and generate meeting link metadata
   */
  approveAppointment: asyncHandler(async (req, res) => {
    const { appointmentId } = req.body;
    const result = await appointmentService.approveAppointment(appointmentId);
    // Return custom success envelope containing the metadata fields directly
    res.json(ApiResponse.success(result));
  }),

  /**
   * Cancel appointment and release the slots lock
   */
  cancelAppointment: asyncHandler(async (req, res) => {
    const { appointmentId } = req.body;
    const result = await appointmentService.cancelAppointment(appointmentId);
    res.json(ApiResponse.success(null, result.message || "Appointment cancelled successfully"));
  }),

  /**
   * Mark appointment payment completion
   */
  payAppointment: asyncHandler(async (req, res) => {
    const { appointmentId } = req.body;
    const result = await appointmentService.payAppointment(appointmentId);
    res.json(ApiResponse.success(null, result.message || "Payment processed successfully"));
  }),

  /**
   * Get list of appointments for a patient
   */
  getPatientAppointments: asyncHandler(async (req, res) => {
    const appointments = await appointmentService.getPatientAppointments(req.params.username);
    res.json(ApiResponse.success(appointments));
  }),

  /**
   * Get list of appointments for a doctor
   */
  getDoctorAppointments: asyncHandler(async (req, res) => {
    const appointments = await appointmentService.getDoctorAppointments(req.params.username);
    res.json(ApiResponse.success(appointments));
  }),

  /**
   * Submit doctor prescription and release consultant fee from escrow
   */
  prescribeAppointment: asyncHandler(async (req, res) => {
    const { appointmentId, drug, dosage, times } = req.body;
    const result = await appointmentService.prescribeAppointment({
      appointmentId,
      drug,
      dosage,
      times
    });
    res.json(ApiResponse.success(result));
  })
};

module.exports = appointmentController;
