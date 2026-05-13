import { NextRequest, NextResponse } from "next/server";

import type { AuthLoginRequestDto } from "@/lib/auth/auth-contract";
import { shouldUseUpstreamAuth } from "@/lib/server/auth-mode";
import { createBackendUrl } from "@/lib/server/backend-url";

import { readMockUsersFromCookies } from "../mock-user-cookie";
import { findMockUserByEmail, findUserByEmail, toAuthPayload } from "../mock-users";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  sanitizeAuthPayload,
} from "../session-cookie";

const readJsonBody = async (response: Response) => {
  const text = await response.text();

  if (!text.trim()) {
    return {} as Record<string, unknown>;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text } as Record<string, unknown>;
  }
};

export const POST = async (request: NextRequest) => {
  const rawBody = await request.text();
  const credentials = JSON.parse(rawBody) as AuthLoginRequestDto;
  const email = credentials.email?.trim().toLowerCase() ?? "";
  const browserMockUsers = readMockUsersFromCookies(request.cookies);
  const browserMockUser = email
    ? browserMockUsers.find((user) => user.email === email)
    : undefined;
  const builtInMockUser = email ? findUserByEmail(email) : undefined;
  const mockUser = browserMockUser ?? builtInMockUser;

  if (mockUser && credentials.password === mockUser.password) {
    const payload = toAuthPayload(mockUser);
    const response = NextResponse.json(sanitizeAuthPayload(payload), {
      status: 200,
    });

    if (payload.token) {
      response.cookies.set(
        AUTH_COOKIE_NAME,
        payload.token,
        AUTH_COOKIE_OPTIONS,
      );
    }

    return response;
  }

  if (!shouldUseUpstreamAuth()) {
    if (browserMockUser) {
      return NextResponse.json(
        { message: "Incorrect password for this client account." },
        { status: 401 },
      );
    }

    if (!builtInMockUser && email) {
      return NextResponse.json(
        {
          message:
            "No registered client account was found for this email in this browser on this site URL.",
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { message: "Invalid email or password." },
      { status: 401 },
    );
  }

  const upstream = await fetch(createBackendUrl("/api/Auth/login"), {
    body: rawBody,
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    redirect: "manual",
  });
  const payload = await readJsonBody(upstream);
  const token = typeof payload.token === "string" ? payload.token : "";
  const response = NextResponse.json(sanitizeAuthPayload(payload), {
    status: upstream.status,
  });

  if (upstream.ok && token) {
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  }

  return response;
};
