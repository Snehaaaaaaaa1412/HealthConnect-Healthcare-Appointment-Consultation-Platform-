import { apiClient } from "../config/api";

export const doctorService = {
  getPublicDoctors: async () => {
    const response = await apiClient.get("/public/doctors");
    return response.data;
  },

  getDoctorById: async (id) => {
    const response = await apiClient.get(`/doctors/${id}`);
    return response.data;
  },

  updateSlots: async (id, slots) => {
    const response = await apiClient.post("/doctors/slots", { id, slots });
    return response.data;
  },

  updateClinicDetails: async (data) => {
    const response = await apiClient.post("/doctors/clinic-details", data);
    return response.data;
  }
};
