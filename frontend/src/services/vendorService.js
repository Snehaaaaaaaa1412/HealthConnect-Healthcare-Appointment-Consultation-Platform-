import { apiClient } from "../config/api";

export const vendorService = {
  getPublicVendors: async () => {
    const response = await apiClient.get("/public/vendors");
    return response.data;
  },

  getVendorById: async (id) => {
    const response = await apiClient.get(`/vendors/${id}`);
    return response.data;
  },

  updateInventory: async (id, inventory) => {
    const response = await apiClient.post("/vendors/inventory", { id, inventory });
    return response.data;
  }
};
