import { NextRequest, NextResponse } from "next/server";

import { toAuthPayload, updateMockUser } from "../mock-users";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "../session-cookie";
import { createBackendUrl } from "@/lib/server/backend-url";
import { getUserFromSessionToken } from "@/lib/auth/session-user";
import { syncMockUserWorkspaceProfile } from "@/lib/server/mock-workspace-store";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim() || cookieToken || "";
  const mockUser = token ? getUserFromSessionToken(token) : null;

  if (mockUser && token.startsWith("mock-token::")) {
    return NextResponse.json(toAuthPayload(mockUser), { status: 200 });
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
    upstream.status === 204 ? null : ((await upstream.json()) as Record<string, unknown> | null);
  const response = NextResponse.json(payload, { status: upstream.status });

  if (upstream.status === 401) {
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 0,
    });
  }

  return response;
}

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim() || cookieToken || "";
  const mockUser = token ? getUserFromSessionToken(token) : null;
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

    syncMockUserWorkspaceProfile(updatedUser, {
      organizationName,
    });

    return NextResponse.json(toAuthPayload(updatedUser), { status: 200 });
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
    upstream.status === 204 ? null : ((await upstream.json()) as Record<string, unknown> | null);
  const response = NextResponse.json(payload, { status: upstream.status });

  if (upstream.status === 401) {
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 0,
    });
  }

  return response;
}
