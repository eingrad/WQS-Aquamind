import axios from "axios";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  STORAGE_KEYS,
} from "../utils/storage";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = getStorageItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite loops

      const refreshToken = getStorageItem<string>(STORAGE_KEYS.REFRESH_TOKEN);

      if (refreshToken && !window.location.pathname.includes("/login")) {
        try {
          // Try to refresh the token
          const response = await axios.post(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
            }/auth/refresh`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear tokens and redirect to login
          removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
          removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
          removeStorageItem(STORAGE_KEYS.USER);

          // Only redirect if not already on login page
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
      } else if (!window.location.pathname.includes("/login")) {
        // No refresh token or already on login - redirect once
        removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
        removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
        removeStorageItem(STORAGE_KEYS.USER);
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

