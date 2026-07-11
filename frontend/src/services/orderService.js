import { apiClient } from "../config/api";

export const orderService = {
  createOrder: async (data) => {
    const response = await apiClient.post("/orders/create", data);
    return response.data;
  },

  getPatientOrders: async (username) => {
    const response = await apiClient.get(`/orders/patient/${username}`);
    return response.data;
  },

  getVendorOrders: async (vendorId) => {
    const response = await apiClient.get(`/orders/vendor/${vendorId}`);
    return response.data;
  },

  dispatchOrder: async (orderId) => {
    const response = await apiClient.post("/orders/dispatch", { orderId });
    return response.data;
  },

  receiveOrder: async (orderId) => {
    const response = await apiClient.post("/orders/receive", { orderId });
    return response.data;
  }
};
