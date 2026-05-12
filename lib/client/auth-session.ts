"use client";

import type { AuthSessionUser } from "@/lib/auth/auth-contract";

const AUTH_STORAGE_KEY = "auth_user";
const LEGACY_TOKEN_KEY = "token";

const getStorage = () =>
  typeof window === "undefined" ? null : window.localStorage;

const migrateLegacySessionValue = (key: string) => {
  if (typeof window === "undefined") {
    return null;
  }

  const localValue = window.localStorage.getItem(key);

  if (localValue) {
    return localValue;
  }

  const sessionValue = window.sessionStorage.getItem(key);

  if (!sessionValue) {
    return null;
  }

  try {
    window.localStorage.setItem(key, sessionValue);
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore migration failures and use the legacy value for this request.
  }

  return sessionValue;
};

export const getSessionToken = () =>
  getStorage()?.getItem(LEGACY_TOKEN_KEY) ??
  migrateLegacySessionValue(LEGACY_TOKEN_KEY);

export const getStoredAuthUser = (): AuthSessionUser | null => {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const raw =
    storage.getItem(AUTH_STORAGE_KEY) ??
    migrateLegacySessionValue(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSessionUser;
  } catch {
    return null;
  }
};

export const storeAuthSession = (user: AuthSessionUser) => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (user.token) {
    storage.setItem(LEGACY_TOKEN_KEY, user.token);
  }

  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
};
