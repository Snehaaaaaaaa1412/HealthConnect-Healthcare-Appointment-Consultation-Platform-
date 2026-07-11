"use strict";

const chatService = require("../services/chatService");
const asyncHandler = require("../utils/asyncHandler");

const chatController = {
  /**
   * Send a chat message
   */
  sendMessage: asyncHandler(async (req, res) => {
    const { doctorUsername, patientUsername, senderRole, senderUsername, message } = req.body;
    const result = await chatService.sendMessage({
      doctorUsername,
      patientUsername,
      senderRole,
      senderUsername,
      message
    });
    res.json({ message: "Message sent", id: result.lastID });
  }),

  /**
   * Get chat partners list for a doctor (patients with approved + paid appointments)
   */
  getDoctorPartners: asyncHandler(async (req, res) => {
    const partners = await chatService.getDoctorPartners(req.params.doctorUsername);
    res.json(partners);
  }),

  /**
   * Get chat partners list for a patient (doctors with approved + paid appointments)
   */
  getPatientPartners: asyncHandler(async (req, res) => {
    const partners = await chatService.getPatientPartners(req.params.patientUsername);
    res.json(partners);
  }),

  /**
   * Get the active consultation context between a doctor and patient
   */
  getChatContext: asyncHandler(async (req, res) => {
    const context = await chatService.getChatContext(req.params.doctorUsername, req.params.patientUsername);
    res.json(context);
  }),

  /**
   * Get complete message log of a chat session
   */
  getConversation: asyncHandler(async (req, res) => {
    const conversation = await chatService.getConversation(req.params.doctorUsername, req.params.patientUsername);
    res.json(conversation);
  })
};

module.exports = chatController;
