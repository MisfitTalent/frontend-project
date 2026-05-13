import { NextRequest, NextResponse } from "next/server";

import type { AuthSessionUser } from "@/lib/auth/auth-contract";
import { getUserFromSessionToken } from "@/lib/auth/session-user";
import { shouldUseUpstreamAuth } from "@/lib/server/auth-mode";
import { createBackendUrl } from "@/lib/server/backend-url";
import { syncMockUserWorkspaceProfile } from "@/lib/server/mock-workspace-store";

import { readMockUsersFromCookies, upsertMockUserCookie } from "../mock-user-cookie";
import { toAuthPayload, updateMockUser } from "../mock-users";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  sanitizeAuthPayload,
} from "../session-cookie";

export const GET = async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const browserMockUsers = readMockUsersFromCookies(request.cookies);
  const token =
    authHeader?.replace(/^Bearer\s+/i, "").trim() || cookieToken || "";
  const mockUser = token ? getUserFromSessionToken(token, browserMockUsers) : null;

  if (mockUser && token.startsWith("mock-token::")) {
    return NextResponse.json(sanitizeAuthPayload(toAuthPayload(mockUser)), {
      status: 200,
    });
  }

  if (!shouldUseUpstreamAuth()) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const headers = new Headers();

  if (authHeader) {
    headers.set("authorization", authHeader);
  } else if (cookieToken) {
    headers.set("authorization", `Bearer ${cookieToken}`);
  }

  const upstream = await fetch(createBackendUrl("/api/Auth/me"), {
    headers,
    method: "GET",
    redirect: "manual",
  });
  const payload =
    upstream.status === 204
      ? null
      : ((await upstream.json()) as AuthSessionUser | null);
  const response = NextResponse.json(
    payload ? sanitizeAuthPayload(payload) : null,
    {
      status: upstream.status,
    },
  );

  if (upstream.status === 401) {
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 0,
    });
  }

  return response;
};

export const PATCH = async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const browserMockUsers = readMockUsersFromCookies(request.cookies);
  const token =
    authHeader?.replace(/^Bearer\s+/i, "").trim() || cookieToken || "";
  const mockUser = token ? getUserFromSessionToken(token, browserMockUsers) : null;
  const body = (await request.json().catch(() => null)) as
    | { firstName?: unknown; lastName?: unknown; organizationName?: unknown }
    | null;

  if (mockUser && token.startsWith("mock-token::")) {
    const firstName = String(body?.firstName ?? "").trim();
    const lastName = String(body?.lastName ?? "").trim();
    const organizationName = String(body?.organizationName ?? "").trim();

    if (!firstName || !lastName) {
      return NextResponse.json(
        { message: "First name and last name are required." },
        { status: 400 },
      );
    }

    const updatedUser = updateMockUser(mockUser.email, {
      firstName,
      lastName,
      tenantName: organizationName || mockUser.tenantName,
    });

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    syncMockUserWorkspaceProfile(updatedUser, { organizationName });

    const response = NextResponse.json(
      sanitizeAuthPayload(toAuthPayload(updatedUser)),
      { status: 200 },
    );
    upsertMockUserCookie(response.cookies, browserMockUsers, updatedUser);

    return response;
  }

  if (!shouldUseUpstreamAuth()) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const headers = new Headers();

  if (authHeader) {
    headers.set("authorization", authHeader);
  } else if (cookieToken) {
    headers.set("authorization", `Bearer ${cookieToken}`);
  }

  headers.set("content-type", "application/json");

  const upstream = await fetch(createBackendUrl("/api/Auth/me"), {
    body: JSON.stringify(body ?? {}),
    headers,
    method: "PATCH",
    redirect: "manual",
  });
  const payload =
    upstream.status === 204
      ? null
      : ((await upstream.json()) as AuthSessionUser | null);
  const response = NextResponse.json(
    payload ? sanitizeAuthPayload(payload) : null,
    {
      status: upstream.status,
    },
  );

  if (upstream.status === 401) {
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 0,
    });
  }

  return response;
};
