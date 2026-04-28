import { NextRequest, NextResponse } from "next/server";

import { findUserByEmail, toAuthPayload } from "../mock-users";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "../session-cookie";
import { createBackendUrl } from "@/lib/server/backend-url";

const readJsonBody = async (response: Response) => {
  const text = await response.text();

  if (!text.trim()) {
    return {} as Record<string, unknown>;
  }

  return JSON.parse(text) as Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const credentials = JSON.parse(rawBody) as { email?: string; password?: string };
  const email = credentials.email?.trim().toLowerCase() ?? "";
  const mockUser = email ? findUserByEmail(email) : undefined;

  if (mockUser && credentials.password === mockUser.password) {
    const payload = toAuthPayload(mockUser);
    const response = NextResponse.json(payload, { status: 200 });

    response.cookies.set(AUTH_COOKIE_NAME, payload.token, AUTH_COOKIE_OPTIONS);

    return response;
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
  const response = NextResponse.json(payload, { status: upstream.status });

  const token = typeof payload.token === "string" ? payload.token : "";

  if (upstream.ok && token) {
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  }

  return response;
}
