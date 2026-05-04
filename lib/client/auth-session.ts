"use client";

import type { AuthSessionUser } from "@/lib/auth/auth-contract";

export const getSessionToken = (): string | null => null;

export const getStoredAuthUser = (): AuthSessionUser | null => null;

export const storeAuthSession = (user: AuthSessionUser) => {
  void user;
};

export const clearAuthSession = () => {};
