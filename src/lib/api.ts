export const tokenManager = {
  getToken: (): string | null =>
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("token"),

  setToken: (token: string): void => {
    localStorage.setItem("authToken", token);
  },

  removeToken: (): void => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  },

  getRefreshToken: (): string | null =>
    localStorage.getItem("refreshToken") ||
    sessionStorage.getItem("refreshToken"),

  setRefreshToken: (token: string) =>
    localStorage.setItem("refreshToken", token),

  removeRefreshToken: () => {
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("refreshToken");
  },

  isTokenValid: (): boolean => {
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("token");

    if (!token) return false;

    try {
      const cleanToken = token.startsWith("Bearer ")
        ? token.slice(7).trim()
        : token.trim();
      const parts = cleanToken.split(".");
      if (parts.length < 2) return false;

      let base64Url = parts[1];
      let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4 !== 0) {
        base64 += "=";
      }

      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);

      // Check if JWT token has expired
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        tokenManager.clearAuthData();
        return false;
      }

      return true;
    } catch {
      return !!token;
    }
  },

  removeRefreshToken: () => localStorage.removeItem("refreshToken"),

  isTokenValid: (): boolean => {
  const token = localStorage.getItem("authToken");
  return !!token;
},
  clearAuthData: (): void => {
    tokenManager.removeToken();
    tokenManager.removeRefreshToken();
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("selectedProjectId");
    try {
      sessionStorage.clear();
    } catch {}
  },
};

import axios from "axios";

const VITE_BASE_URL = "http://20.214.185.47:8080/api/v1";

export const FILE_SERVER_BASE_URL = VITE_BASE_URL.replace(/\/api\/v1\/?$/, "");

const apiClient = axios.create({
  baseURL: VITE_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();

    if (token) {
      const cleanToken = token.startsWith("Bearer ")
        ? token.slice(7).trim()
        : token.trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      tokenManager.clearAuthData();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:logout"));
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/forgot-password" &&
          window.location.pathname !== "/reset-password"
        ) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;