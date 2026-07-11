"use strict";

const db = require("../config/database");
const { dbRun } = require("../utils/dbHelpers");
const appointmentRepository = require("../repositories/appointmentRepository");
const doctorRepository = require("../repositories/doctorRepository");
const userRepository = require("../repositories/userRepository");

const appointmentService = {
  /**
   * Book an appointment with slots verification and transactional locking.
   *
   * @param {Object} data
   * @returns {Promise<{ message: string }>}
   */
  bookAppointment: async ({
    patientUsername,
    patientFullName,
    doctorUsername,
    doctorFullName,
    specialization,
    slot,
    symptoms,
    fee,
    medicalReportPath
  }) => {
    const symptomsText = (symptoms || "").trim();
    const symptomsToStore = symptomsText || "Medical report attached";

    let slotParsed = slot;
    if (typeof slot === "string" && slot.trim().startsWith("{")) {
      try {
        slotParsed = JSON.parse(slot);
      } catch (e) {
        slotParsed = slot;
      }
    }

    const slotDatetime = (typeof slotParsed === "object" && slotParsed !== null) ? slotParsed.datetime : slotParsed;
    const slotId = (typeof slotParsed === "object" && slotParsed !== null) ? slotParsed.id : null;
    const numericFee = parseFloat(fee) || 0.0;

    // Use transaction lock to prevent double booking
    await dbRun("BEGIN IMMEDIATE TRANSACTION");

    try {
      // 1. Fetch doctor by username
      const doctor = await doctorRepository.findByUsername(doctorUsername);
      if (!doctor) {
        throw new Error("Doctor not found");
      }

      let slotsArr = [];
      try {
        slotsArr = JSON.parse(doctor.slots || "[]");
      } catch (e) {
        slotsArr = [];
      }

      // Check slot availability
      const slotExists = slotsArr.some((s) => {
        if (typeof s === "object" && s !== null) {
          return s.id === slotId || s.datetime === slotDatetime;
        }
        return s === slotDatetime;
      });

      if (!slotExists) {
        throw new Error("This slot is no longer available. It may have been booked or locked by another user.");
      }

      // Remove booked slot
      const updatedSlots = slotsArr.filter((s) => {
        if (typeof s === "object" && s !== null) {
          return s.id !== slotId && s.datetime !== slotDatetime;
        }
        return s !== slotDatetime;
      });

      // 2. Create appointment
      await appointmentRepository.create({
        patientUsername,
        patientFullName,
        doctorUsername,
        doctorFullName,
        specialization,
        slot: slotDatetime,
        symptoms: symptomsToStore,
        fee: numericFee,
        medicalReportPath
      });

      // 3. Update doctor slots availability
      await doctorRepository.updateSlots(doctor.id, JSON.stringify(updatedSlots));

      // 4. Commit transaction
      await dbRun("COMMIT");

      return { message: "Appointment booked successfully" };
    } catch (error) {
      await dbRun("ROLLBACK");
      throw error;
    }
  },

  /**
   * Approve a doctor consultation appointment and compile details for confirmation.
   *
   * @param {number} appointmentId
   * @returns {Promise<Object>} The approval receipt details
   */
  approveAppointment: async (appointmentId) => {
    const appt = await appointmentRepository.findById(appointmentId);
    if (!appt) {
      throw new Error("Appointment not found");
    }

    await appointmentRepository.updateStatus(appointmentId, "approved");

    const patient = await userRepository.findByUsernamePublic(appt.patientUsername);
    const doctor = await doctorRepository.findByUsername(appt.doctorUsername);

    const meetingLink = `https://meet.healthconnect.live/consult-${appointmentId}-${Date.now().toString(36)}`;

    // Clean up doctor object to prevent password leaking
    let cleanDoctor = {};
    if (doctor) {
      const { password: _, ...doc } = doctor;
      cleanDoctor = doc;
    }

    return {
      message: "Appointment approved successfully",
      appointment: appt,
      patientEmail: patient ? patient.email : "",
      doctorClinic: cleanDoctor,
      meetingLink
    };
  },

  /**
   * Cancel consultation appointment and release slot back to doctor slots list.
   *
   * @param {number} appointmentId
   * @returns {Promise<{ message: string }>}
   */
  cancelAppointment: async (appointmentId) => {
    const appt = await appointmentRepository.findById(appointmentId);
    if (!appt) {
      throw new Error("Appointment not found");
    }

    await appointmentRepository.updateStatus(appointmentId, "cancelled");

    const doctor = await doctorRepository.findByUsername(appt.doctorUsername);
    if (!doctor) {
      return { message: "Appointment cancelled, but slot release failed" };
    }

    let slotsArr = [];
    try {
      slotsArr = JSON.parse(doctor.slots || "[]");
    } catch (e) {
      slotsArr = [];
    }

    const restoredSlot = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      datetime: appt.slot,
      fee: appt.fee || 0.0
    };

    slotsArr.push(restoredSlot);
    await doctorRepository.updateSlots(doctor.id, JSON.stringify(slotsArr));

    return { message: "Appointment cancelled successfully" };
  },

  /**
   * Mark appointment payment completion.
   *
   * @param {number} appointmentId
   * @returns {Promise<{ message: string }>}
   */
  payAppointment: async (appointmentId) => {
    await appointmentRepository.updatePaymentStatus(appointmentId, "Successful");
    return { message: "Payment processed successfully" };
  },

  /**
   * Get patient appointments list.
   *
   * @param {string} username
   * @returns {Promise<Array>}
   */
  getPatientAppointments: async (username) => {
    return appointmentRepository.findByPatient(username);
  },

  /**
   * Get doctor appointments list.
   *
   * @param {string} username
   * @returns {Promise<Array>}
   */
  getDoctorAppointments: async (username) => {
    return appointmentRepository.findByDoctor(username);
  },

  /**
   * Submit prescription details and payout held consultation fee to doctor balance.
   *
   * @param {Object} prescriptionData
   * @returns {Promise<Object>} Payout receipt details
   */
  prescribeAppointment: async ({ appointmentId, drug, dosage, times }) => {
    await dbRun("BEGIN IMMEDIATE TRANSACTION");

    try {
      const appt = await appointmentRepository.findById(appointmentId);
      if (!appt) {
        throw new Error("Appointment not found");
      }

      if (appt.prescriptionDrug) {
        throw new Error("Prescription has already been written for this consultation");
      }

      await appointmentRepository.updatePrescription(appointmentId, { drug, dosage, times });

      let payoutTransferred = 0;
      if (appt.paymentStatus === "Successful" && appt.escrowStatus === "held") {
        payoutTransferred = appt.fee || 0.0;
        await doctorRepository.incrementBalance(appt.doctorUsername, payoutTransferred);
        await appointmentRepository.updateEscrowStatus(appointmentId, "released");
      }

      await dbRun("COMMIT");

      return {
        message: "Prescription written successfully",
        payoutTransferred
      };
    } catch (error) {
      await dbRun("ROLLBACK");
      throw error;
    }
  },

  /**
   * Scan and cancel all unpaid appointment lease-locks older than 10 minutes,
   * restoring the slot back to the doctor's available availability.
   *
   * @returns {Promise<void>}
   */
  releaseExpiredLocks: async () => {
    const expiredAppointments = await appointmentRepository.findExpiredLocks();
    if (expiredAppointments && expiredAppointments.length > 0) {
      for (const appt of expiredAppointments) {
        await dbRun("BEGIN IMMEDIATE TRANSACTION");
        try {
          const doctor = await doctorRepository.findByUsername(appt.doctorUsername);
          if (!doctor) {
            throw new Error("Doctor not found for expired lock");
          }

          let slotsArr = [];
          try {
            slotsArr = JSON.parse(doctor.slots || "[]");
          } catch (e) {
            slotsArr = [];
          }

          const restoredSlot = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            datetime: appt.slot,
            fee: appt.fee || 0.0
          };
          slotsArr.push(restoredSlot);

          await doctorRepository.updateSlots(doctor.id, JSON.stringify(slotsArr));
          await appointmentRepository.updateStatus(appt.id, "cancelled");

          await dbRun("COMMIT");
          console.log(`[Escrow Lease Lock] Released expired slot lock for appointment ID ${appt.id}`);
        } catch (err) {
          await dbRun("ROLLBACK");
          console.error(`[Escrow Lease Lock] Failed to release slot lock for appointment ID ${appt.id}:`, err.message);
        }
      }
    }
  }
};

module.exports = appointmentService;
