import api from "./api";
import {
  getStorageItem,
  setStorageItem,
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
export const login = async (credentials: LoginCredentials) => {
  const response = await api.post("/auth/login", credentials);
  const { accessToken, refreshToken } = response.data.data.tokens;
  const user = response.data.data.user;

  // Store tokens
  setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  setStorageItem(STORAGE_KEYS.USER, user);

  return response.data;
};

/**
 * Logout user and clear tokens
 */
export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    // Continue even if API call fails
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
