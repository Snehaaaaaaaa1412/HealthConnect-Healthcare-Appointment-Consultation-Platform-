import { apiClient } from "../config/api";

export const chatService = {
  sendMessage: async (data) => {
    const response = await apiClient.post("/chat/send", data);
    return response.data;
  },

  getDoctorPartners: async (doctorUsername) => {
    const response = await apiClient.get(`/chat/doctor-partners/${doctorUsername}`);
    return response.data;
  },

  getPatientPartners: async (patientUsername) => {
    const response = await apiClient.get(`/chat/patient-partners/${patientUsername}`);
    return response.data;
  },

  getConversation: async (doctorUsername, patientUsername) => {
    const response = await apiClient.get(`/chat/${doctorUsername}/${patientUsername}`);
    return response.data;
  },

  getContext: async (doctorUsername, patientUsername) => {
    const response = await apiClient.get(`/chat/context/${doctorUsername}/${patientUsername}`);
    return response.data;
  }
};
