import { NextRequest, NextResponse } from "next/server";

import { registerMockUser, toAuthPayload, type MockUserRole } from "../mock-users";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "../session-cookie";
import { shouldUseUpstreamAuth } from "@/lib/server/auth-mode";
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

  if (!shouldUseUpstreamAuth()) {
    const payload = JSON.parse(rawBody) as {
      email?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      password?: unknown;
      role?: unknown;
      tenantName?: unknown;
    };
    const email = String(payload.email ?? "").trim().toLowerCase();
    const firstName = String(payload.firstName ?? "").trim();
    const lastName = String(payload.lastName ?? "").trim();
    const password = String(payload.password ?? "").trim();
    const role =
      payload.role === "Admin" ||
      payload.role === "SalesManager" ||
      payload.role === "BusinessDevelopmentManager" ||
      payload.role === "SalesRep" ||
      payload.role === "Client"
        ? (payload.role as MockUserRole)
        : "SalesRep";
    const tenantName = String(payload.tenantName ?? "").trim();

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { message: "Email, first name, last name, and password are required." },
        { status: 400 },
      );
    }

    const user = registerMockUser({
      email,
      firstName,
      lastName,
      password,
      role,
      tenantName,
    });

    if (!user) {
      return NextResponse.json({ message: "A user with that email already exists." }, { status: 409 });
    }

    const responsePayload = toAuthPayload(user);
    const response = NextResponse.json(responsePayload, { status: 200 });
    response.cookies.set(AUTH_COOKIE_NAME, responsePayload.token, AUTH_COOKIE_OPTIONS);
    return response;
  }

  const upstream = await fetch(createBackendUrl("/api/Auth/register"), {
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
