import { apiClient } from "../config/api";

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post("/login", credentials);
    return response.data;
  },

  register: async (data) => {
    const response = await apiClient.post("/register", data);
    return response.data;
  },

  verifyOtp: async (otpToken, otp) => {
    const response = await apiClient.post("/auth/verify-otp", { otpToken, otp });
    return response.data;
  },

  resendOtp: async (otpToken) => {
    const response = await apiClient.post("/auth/resend-otp", { otpToken });
    return response.data;
  }
};
