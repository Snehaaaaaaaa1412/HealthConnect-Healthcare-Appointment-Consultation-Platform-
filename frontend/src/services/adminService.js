import { apiClient } from "../config/api";

export const adminService = {
  getStats: async () => {
    const response = await apiClient.get("/admin/stats");
    return response.data;
  },

  getAllDoctors: async () => {
    const response = await apiClient.get("/admin/doctors");
    return response.data;
  },

  getAllVendors: async () => {
    const response = await apiClient.get("/admin/vendors");
    return response.data;
  },

  getAnalytics: async () => {
    const response = await apiClient.get("/admin/analytics");
    return response.data;
  },

  approveDoctor: async (id) => {
    const response = await apiClient.post("/admin/approve-doctor", { id });
    return response.data;
  },

  approveVendor: async (id) => {
    const response = await apiClient.post("/admin/approve-vendor", { id });
    return response.data;
  },

  deleteDoctor: async (id) => {
    const response = await apiClient.post("/admin/delete-doctor", { id });
    return response.data;
  },

  deleteVendor: async (id) => {
    const response = await apiClient.post("/admin/delete-vendor", { id });
    return response.data;
  }
};
