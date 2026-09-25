import axios from "axios";

// Primary API Client targeting backend gateway
export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "https://healthconnect-backend-8fa2.onrender.com",
});

// Secondary API Client targeting Flask OCR/triage microservice
export const ocrClient = axios.create({
  baseURL: process.env.REACT_APP_OCR_BASE_URL || "https://healthconnect-ocr-service.onrender.com",
});

// Automatically attach JWT token from localStorage to outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("healthconnect_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Catch 401 errors globally and trigger local logout redirect
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("healthconnect_user");
      localStorage.removeItem("healthconnect_role");
      localStorage.removeItem("healthconnect_token");
      delete apiClient.defaults.headers.common["Authorization"];
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

