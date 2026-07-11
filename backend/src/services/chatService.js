"use strict";

const chatRepository = require("../repositories/chatRepository");

const chatService = {
  /**
   * Send a chat message.
   *
   * @param {Object} messageData
   * @returns {Promise<Object>} The query result with lastID
   */
  sendMessage: async (messageData) => {
    return chatRepository.saveMessage(messageData);
  },

  /**
   * Get chat partners list for a doctor.
   *
   * @param {string} doctorUsername
   * @returns {Promise<Array>}
   */
  getDoctorPartners: async (doctorUsername) => {
    return chatRepository.getDoctorPartners(doctorUsername);
  },

  /**
   * Get chat partners list for a patient.
   *
   * @param {string} patientUsername
   * @returns {Promise<Array>}
   */
  getPatientPartners: async (patientUsername) => {
    return chatRepository.getPatientPartners(patientUsername);
  },

  /**
   * Get consultation details context between doctor and patient.
   *
   * @param {string} doctorUsername
   * @param {string} patientUsername
   * @returns {Promise<Object|null>}
   */
  getChatContext: async (doctorUsername, patientUsername) => {
    return chatRepository.getContext(doctorUsername, patientUsername);
  },

  /**
   * Get all messages for doctor-patient conversation.
   *
   * @param {string} doctorUsername
   * @param {string} patientUsername
   * @returns {Promise<Array>}
   */
  getConversation: async (doctorUsername, patientUsername) => {
    return chatRepository.getConversation(doctorUsername, patientUsername);
  }
};

module.exports = chatService;
