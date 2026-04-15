import api from "./api";
import axios from "axios";
import {
  getStorageItem,
  setStorageItem,
  setStorageMode,
  removeStorageItem,
  STORAGE_KEYS,
} from "../utils/storage";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  role?: string;
  roleName?: string;
  userRole: {
    roleId: string;
    role: {
      roleName: string;
    };
  };
}

/**
 * Login user and store tokens
 */
export const login = async (
  credentials: LoginCredentials,
  rememberMe: boolean = true,
) => {
  const response = await api.post("/auth/login", credentials);
  const { accessToken, refreshToken } = response.data.data.tokens;
  const user = response.data.data.user;

  // Set storage mode BEFORE writing tokens
  setStorageMode(rememberMe);

  // Store tokens in the chosen storage
  setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  setStorageItem(STORAGE_KEYS.USER, user);

  return response.data;
};

/**
 * Logout user and clear tokens
 * Uses a direct axios call (not the api instance) to avoid the
 * response interceptor redirecting to /login on 401 before
 * the revocation request completes.
 */
export const logout = async () => {
  try {
    const refreshToken = getStorageItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
    const accessToken = getStorageItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
    const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

    if (refreshToken && accessToken) {
      await axios.post(
        `${baseURL}/auth/logout`,
        { refreshToken },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );
    }
  } catch (error) {
    // Continue even if API call fails
    console.warn("Logout API call failed:", error);
  } finally {
    removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
    removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
    removeStorageItem(STORAGE_KEYS.USER);
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get("/auth/me");
  return response.data.data;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Get stored user from localStorage
 */
export const getStoredUser = (): User | null => {
  return getStorageItem<User>(STORAGE_KEYS.USER);
};
