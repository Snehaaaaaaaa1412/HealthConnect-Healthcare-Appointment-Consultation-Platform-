"use strict";

const appointmentService = require("../services/appointmentService");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const { uploadToCloudinary } = require("../utils/cloudinaryHelper");

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

    let medicalReportPath = "";
    if (req.file) {
      const cloudinaryUrl = await uploadToCloudinary(req.file.path);
      if (cloudinaryUrl) {
        medicalReportPath = cloudinaryUrl;
      } else {
        medicalReportPath = `/uploads/medical_reports/${req.file.filename}`;
      }
    }

    const result = await appointmentService.bookAppointment({
      patientUsername,
      patientFullName,
      doctorUsername,
      doctorFullName,
      specialization,
      slot,
      symptoms,
      fee,
      medicalReportPath
    }, req.user);

    res.json(ApiResponse.success(null, result.message || "Appointment booked successfully"));
  }),

  /**
   * Approve doctor consultation and generate meeting link metadata
   */
  approveAppointment: asyncHandler(async (req, res) => {
    const { appointmentId } = req.body;
    const result = await appointmentService.approveAppointment(appointmentId, req.user);
    // Return custom success envelope containing the metadata fields directly
    res.json(ApiResponse.success(result));
  }),

  /**
   * Cancel appointment and release the slots lock
   */
  cancelAppointment: asyncHandler(async (req, res) => {
    const { appointmentId } = req.body;
    const result = await appointmentService.cancelAppointment(appointmentId, req.user);
    res.json(ApiResponse.success(null, result.message || "Appointment cancelled successfully"));
  }),

  /**
   * Mark appointment payment completion
   */
  payAppointment: asyncHandler(async (req, res) => {
    const { appointmentId } = req.body;
    const result = await appointmentService.payAppointment(appointmentId, req.user);
    res.json(ApiResponse.success(null, result.message || "Payment processed successfully"));
  }),

  /**
   * Get list of appointments for a patient
   */
  getPatientAppointments: asyncHandler(async (req, res) => {
    const appointments = await appointmentService.getPatientAppointments(req.params.username, req.user);
    res.json(ApiResponse.success(appointments));
  }),

  /**
   * Get list of appointments for a doctor
   */
  getDoctorAppointments: asyncHandler(async (req, res) => {
    const appointments = await appointmentService.getDoctorAppointments(req.params.username, req.user);
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
    }, req.user);
    res.json(ApiResponse.success(result));
  })
};

module.exports = appointmentController;
