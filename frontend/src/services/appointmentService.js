import { apiClient } from "../config/api";

export const appointmentService = {
  getPatientAppointments: async (username) => {
    const response = await apiClient.get(`/appointments/patient/${username}`);
    return response.data;
  },

  getDoctorAppointments: async (username) => {
    const response = await apiClient.get(`/appointments/doctor/${username}`);
    return response.data;
  },

  bookAppointment: async (formData) => {
    const response = await apiClient.post("/appointments/book", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },

  approveAppointment: async (appointmentId) => {
    const response = await apiClient.post("/appointments/approve", { appointmentId });
    return response.data;
  },

  cancelAppointment: async (appointmentId) => {
    const response = await apiClient.post("/appointments/cancel", { appointmentId });
    return response.data;
  },

  processPayment: async (appointmentId) => {
    const response = await apiClient.post("/appointments/pay", { appointmentId });
    return response.data;
  },

  issuePrescription: async (data) => {
    const response = await apiClient.post("/appointments/prescribe", data);
    return response.data;
  }
};
