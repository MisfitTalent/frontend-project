import { NextRequest, NextResponse } from "next/server";

import { readMockUsersFromCookies } from "../mock-user-cookie";
import {
  AUTH_COOKIE_NAME,
  sanitizeAuthPayload,
} from "../session-cookie";
import {
  findMockUserByEmail,
  getMockUserEmailFromToken,
  toAuthPayload,
} from "../mock-users";

export const GET = async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value?.trim() ?? "";
  const browserMockUsers = readMockUsersFromCookies(request.cookies);
  const token =
    authHeader?.replace(/^Bearer\s+/i, "").trim() || cookieToken || "";
  const mockSessionEmail = token.startsWith("mock-token::")
    ? getMockUserEmailFromToken(token)
    : "";
  const resolvedMockUser = mockSessionEmail
    ? findMockUserByEmail(mockSessionEmail, browserMockUsers)
    : undefined;

  return NextResponse.json({
    authCookiePresent: Boolean(cookieToken),
    mockRegistryCookiePresent:
      request.cookies.get("autosales_mock_users")?.value?.trim().length
        ? true
        : false,
    mockRegistryUserCount: browserMockUsers.length,
    mockSessionEmail: mockSessionEmail || null,
    resolvedMockSession: resolvedMockUser
      ? sanitizeAuthPayload(toAuthPayload(resolvedMockUser))
      : null,
    storedMockEmails: browserMockUsers.map((user) => user.email),
  });
};
