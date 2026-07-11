"use strict";

const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");

// POST /doctors/clinic-details
router.post("/doctors/clinic-details", doctorController.updateClinicDetails);

// POST /doctors/slots
router.post("/doctors/slots", doctorController.updateSlots);

// GET /doctors/:id
router.get("/doctors/:id", doctorController.getDoctorById);

// POST /doctors/update-specialization
router.post("/doctors/update-specialization", doctorController.updateSpecialization);

// GET /public/doctors (whitelisted in authMiddleware)
router.get("/public/doctors", doctorController.getApprovedDoctors);

module.exports = router;
