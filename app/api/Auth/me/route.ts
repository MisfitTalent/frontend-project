import { NextRequest, NextResponse } from "next/server";

import { toAuthPayload } from "../mock-users";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "../session-cookie";
import { createBackendUrl } from "@/lib/server/backend-url";
import { getUserFromSessionToken } from "@/lib/auth/session-user";

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
