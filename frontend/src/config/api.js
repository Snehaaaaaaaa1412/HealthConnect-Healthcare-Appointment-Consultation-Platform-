import axios from "axios";

// Primary API Client targeting backend gateway
export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:5000",
});

// Secondary API Client targeting Flask OCR/triage microservice
export const ocrClient = axios.create({
  baseURL: process.env.REACT_APP_OCR_BASE_URL || "http://localhost:5001",
});
