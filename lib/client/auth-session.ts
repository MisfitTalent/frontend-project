"use client";

import type { AuthSessionUser } from "@/lib/auth/auth-contract";

const AUTH_STORAGE_KEY = "auth_user";

const getStorage = () =>
  typeof window === "undefined" ? null : window.sessionStorage;

const sanitizeStoredUser = (user: AuthSessionUser): AuthSessionUser => ({
  ...user,
  token: null,
});

export const getSessionToken = () => null;

export const getStoredAuthUser = (): AuthSessionUser | null => {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const raw = storage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSessionUser;
  } catch {
    return null;
  }
};

export const isStoredMockSession = () => Boolean(getStoredAuthUser()?.isMockSession);

export const storeAuthSession = (user: AuthSessionUser) => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sanitizeStoredUser(user)));
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem("token");
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem("token");
};
