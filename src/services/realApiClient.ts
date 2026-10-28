import axios from "axios";
import { tokenManager } from "../lib/api";

const realApiClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

realApiClient.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

realApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let customMessage = "An unexpected error occurred";
    if (error.response) {
      const data = error.response.data;
      customMessage =
        data?.statusMessage ||
        data?.message ||
        `Server error (${error.response.status})`;
      if (error.response.status === 401) tokenManager.clearAuthData();
    } else if (error.request) {
      customMessage =
        "Unable to connect to the backend server. Please ensure it is running.";
    } else {
      customMessage = error.message;
    }
    error.message = customMessage;
    return Promise.reject(error);
  },
);

export default realApiClient;
