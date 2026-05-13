import { NextRequest, NextResponse } from "next/server";

import { shouldUseUpstreamAuth } from "@/lib/server/auth-mode";
import { createBackendUrl } from "@/lib/server/backend-url";
import { provisionMockClientWorkspace } from "@/lib/server/mock-workspace-store";

import { readMockUsersFromCookies, upsertMockUserCookie } from "../mock-user-cookie";
import {
  registerMockUser,
  toAuthPayload,
  updateMockUser,
  type MockUserRole,
} from "../mock-users";
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

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!shouldUseUpstreamAuth()) {
    const browserMockUsers = readMockUsersFromCookies(request.cookies);
    const payload = JSON.parse(rawBody) as {
      email?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      password?: unknown;
      role?: unknown;
      tenantId?: unknown;
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
    const tenantId = String(payload.tenantId ?? "").trim();
    const tenantName = String(payload.tenantName ?? "").trim();

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        {
          message:
            "Email, first name, last name, and password are required.",
        },
        { status: 400 },
      );
    }

    if (role !== "Client") {
      return NextResponse.json(
        {
          message:
            "Public registration is limited to client accounts. Employee accounts must be created by an administrator.",
        },
        { status: 403 },
      );
    }

    const user = registerMockUser({
      email,
      firstName,
      lastName,
      password,
      role,
      tenantId,
      tenantName,
    });

    if (!user) {
      return NextResponse.json(
        { message: "A user with that email already exists." },
        { status: 409 },
      );
    }

    const resolvedUser =
      role === "Client"
        ? (() => {
            const client = provisionMockClientWorkspace(user, {
              organizationName: tenantName || user.tenantName,
            });

            return (
              updateMockUser(user.email, {
                clientIds: [client.id],
              }) ?? user
            );
          })()
        : user;
    const responsePayload = toAuthPayload(resolvedUser);
    const response = NextResponse.json(
      sanitizeAuthPayload(responsePayload),
      { status: 200 },
    );
    upsertMockUserCookie(response.cookies, browserMockUsers, resolvedUser);

    if (responsePayload.token) {
      response.cookies.set(
        AUTH_COOKIE_NAME,
        responsePayload.token,
        AUTH_COOKIE_OPTIONS,
      );
    }

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
  const token = typeof payload.token === "string" ? payload.token : "";
  const response = NextResponse.json(sanitizeAuthPayload(payload), {
    status: upstream.status,
  });

  if (upstream.ok && token) {
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  }

  return response;
}
