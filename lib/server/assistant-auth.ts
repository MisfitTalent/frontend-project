import "server-only";

import type { NextRequest } from "next/server";

import { createBackendUrl } from "@/lib/server/backend-url";
import type { IMockUser } from "@/app/api/Auth/mock-users";
import { AUTH_COOKIE_NAME } from "@/app/api/Auth/session-cookie";
import type { AuthSessionUser } from "@/lib/auth/auth-contract";
import { normalizeUserRole } from "@/lib/auth/roles";
import { getUserFromSessionToken } from "@/lib/auth/session-user";

const toAuthorizedUser = (payload: AuthSessionUser): IMockUser | null => {
  const role = normalizeUserRole(payload.roles?.[0] ?? null);
  const userId =
    typeof payload.userId === "string" && payload.userId.trim().length > 0
      ? payload.userId
      : typeof payload.email === "string" && payload.email.trim().length > 0
        ? payload.email
        : null;

  if (!userId) {
    return null;
  }

  return {
    clientIds: payload.clientIds ?? [],
    email: payload.email ?? "",
    firstName: payload.firstName ?? "",
    id: userId,
    lastName: payload.lastName ?? "",
    password: "",
    role,
    tenantId: payload.tenantId ?? "external-tenant",
    tenantName: payload.tenantName ?? "External Workspace",
  };
};

const fetchAuthorizedUserFromBackend = async (token: string) => {
  const headers = new Headers();
  headers.set("authorization", `Bearer ${token}`);

  try {
    const upstream = await fetch(createBackendUrl("/api/Auth/me"), {
      headers,
      method: "GET",
      redirect: "manual",
    });

    if (!upstream.ok || upstream.status === 204) {
      return null;
    }

    const payload = (await upstream.json()) as AuthSessionUser | null;

    return payload ? toAuthorizedUser(payload) : null;
  } catch {
    return null;
  }
};

export const getAuthorizedUser = async (request: NextRequest): Promise<IMockUser | null> => {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : cookieToken?.trim() ?? "";

  if (cookieToken) {
    const directUser = getUserFromSessionToken(cookieToken);

    if (directUser && (directUser.clientIds?.length ?? 0) > 0) {
      return directUser;
    }
  }

  if (!token) {
    return null;
  }

  const directUser = getUserFromSessionToken(token);
  const enrichedUser = await fetchAuthorizedUserFromBackend(token);

  if (enrichedUser) {
    return enrichedUser;
  }

  if (directUser) {
    return directUser;
  }

  return null;
};
