/**
 * Storage Management Utilities
 * Supports both localStorage (Remember Me ON) and sessionStorage (Remember Me OFF).
 *
 * - localStorage:   tokens persist across browser sessions
 * - sessionStorage:  tokens are cleared when the browser/tab closes
 */

/**
 * Storage keys used across the application
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  /** Stored in localStorage only — tells us which storage mode was last used */
  REMEMBER_ME: "rememberMe",
} as const;

// ──────────────────────────────────────────────
// Internal: which storage backend to write to
// ──────────────────────────────────────────────

let _useSession = false;

/**
 * Set the active storage mode.
 * Call this once at login, BEFORE writing tokens.
 *
 * @param rememberMe  true  → localStorage (persists)
 *                    false → sessionStorage (cleared on close)
 */
export const setStorageMode = (rememberMe: boolean): void => {
  _useSession = !rememberMe;

  // Persist the preference so initStorageMode can restore it on page reload
  try {
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, JSON.stringify(rememberMe));
  } catch {
    /* non-critical */
  }

  // Clear tokens from the *other* storage to avoid stale duplicates
  const stale = rememberMe ? sessionStorage : localStorage;
  try {
    stale.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    stale.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    stale.removeItem(STORAGE_KEYS.USER);
  } catch {
    /* non-critical */
  }
};

/**
 * Restore the storage mode from a previous session.
 * Call this once on app boot (e.g. in main.tsx or App.tsx).
 */
export const initStorageMode = (): void => {
  try {
    const flag = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    // If the user previously chose "don't remember", use session storage
    _useSession = flag === "false";
  } catch {
    _useSession = false;
  }
};

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

const activeStorage = (): Storage =>
  _useSession ? sessionStorage : localStorage;

/**
 * Get an item from storage.
 * Checks sessionStorage first, then localStorage, so it works regardless
 * of which mode was active when the value was written.
 */
export const getStorageItem = <T = string>(key: string): T | null => {
  try {
    // Try session first (short-lived), then local (persistent)
    const item = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    if (!item) return null;

    try {
      return JSON.parse(item) as T;
    } catch {
      return item as T;
    }
  } catch (error) {
    console.error(`Error reading from storage: ${key}`, error);
    return null;
  }
};

/**
 * Set an item in the active storage backend.
 */
export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    activeStorage().setItem(key, stringValue);
  } catch (error) {
    console.error(`Error writing to storage: ${key}`, error);
  }
};

/**
 * Remove an item from BOTH storages to ensure clean logout.
 */
export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from storage: ${key}`, error);
  }
};

/**
 * Clear all application data from both storages.
 */
export const clearStorage = (): void => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.error("Error clearing storage", error);
  }
};
