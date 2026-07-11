"use strict";

const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const validate = require("../middleware/validationMiddleware");

// Validation Schemas
const clinicDetailsSchema = {
  id: { required: true, type: "number" },
  clinicTiming: { required: true, minLength: 5 },
  clinicAddress: { required: true, minLength: 5 },
  consultationAvailability: { required: true }
};

const slotsSchema = {
  id: { required: true, type: "number" },
  slots: { required: true }
};

const specializationSchema = {
  id: { required: true, type: "number" },
  specialization: { required: true, minLength: 3 }
};

// POST /doctors/clinic-details
router.post("/doctors/clinic-details", validate(clinicDetailsSchema), doctorController.updateClinicDetails);

// POST /doctors/slots
router.post("/doctors/slots", validate(slotsSchema), doctorController.updateSlots);

// GET /doctors/:id
router.get("/doctors/:id", doctorController.getDoctorById);

// POST /doctors/update-specialization
router.post("/doctors/update-specialization", validate(specializationSchema), doctorController.updateSpecialization);

// GET /public/doctors (whitelisted in authMiddleware)
router.get("/public/doctors", doctorController.getApprovedDoctors);

module.exports = router;
