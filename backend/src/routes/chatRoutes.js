"use strict";

const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const validate = require("../middleware/validationMiddleware");

// Validation Schemas
const sendChatSchema = {
  doctorUsername: { required: true, minLength: 3 },
  patientUsername: { required: true, minLength: 3 },
  senderRole: { required: true, enum: ["doctor", "user"] },
  message: { required: true, minLength: 1 }
};

// Chat: Send message between doctor and patient
router.post("/chat/send", validate(sendChatSchema), chatController.sendMessage);

// Chat: List chat partners for a doctor (patients with approved + paid appointments)
router.get("/chat/doctor-partners/:doctorUsername", chatController.getDoctorPartners);

// Chat: List chat partners for a patient (doctors with approved + paid appointments)
router.get("/chat/patient-partners/:patientUsername", chatController.getPatientPartners);

// Chat: Get latest paid appointment context for a doctor-patient pair
router.get("/chat/context/:doctorUsername/:patientUsername", chatController.getChatContext);

// Chat: Get conversation between doctor and patient
router.get("/chat/:doctorUsername/:patientUsername", chatController.getConversation);

module.exports = router;
