"use client";

import type { IUserLoginResponse } from "@/providers/authProvider/context";

const AUTH_STORAGE_KEY = "auth_user";

export const getSessionToken = () =>
  typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

export const getStoredAuthUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as IUserLoginResponse;
  } catch {
    return null;
  }
};

export const storeAuthSession = (user: IUserLoginResponse) => {
  if (typeof window === "undefined") {
    return;
  }

  if (user.token) {
    sessionStorage.setItem("token", user.token);
  }

  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem("token");
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
};
