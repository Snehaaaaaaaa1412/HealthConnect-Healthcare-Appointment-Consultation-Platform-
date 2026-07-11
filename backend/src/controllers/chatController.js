"use strict";

const chatService = require("../services/chatService");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

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
    res.json(ApiResponse.success({ id: result.lastID }, "Message sent"));
  }),

  /**
   * Get chat partners list for a doctor (patients with approved + paid appointments)
   */
  getDoctorPartners: asyncHandler(async (req, res) => {
    const partners = await chatService.getDoctorPartners(req.params.doctorUsername);
    res.json(ApiResponse.success(partners));
  }),

  /**
   * Get chat partners list for a patient (doctors with approved + paid appointments)
   */
  getPatientPartners: asyncHandler(async (req, res) => {
    const partners = await chatService.getPatientPartners(req.params.patientUsername);
    res.json(ApiResponse.success(partners));
  }),

  /**
   * Get the active consultation context between a doctor and patient
   */
  getChatContext: asyncHandler(async (req, res) => {
    const context = await chatService.getChatContext(req.params.doctorUsername, req.params.patientUsername);
    res.json(ApiResponse.success(context));
  }),

  /**
   * Get complete message log of a chat session
   */
  getConversation: asyncHandler(async (req, res) => {
    const conversation = await chatService.getConversation(req.params.doctorUsername, req.params.patientUsername);
    res.json(ApiResponse.success(conversation));
  })
};

module.exports = chatController;
