import "server-only";

import type { NextRequest } from "next/server";

import type { IMockUser } from "@/app/api/Auth/mock-users";
import { AUTH_COOKIE_NAME } from "@/app/api/Auth/session-cookie";
import { getUserFromSessionToken } from "@/lib/auth/session-user";

export const getAuthorizedUser = (request: NextRequest): IMockUser | null => {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (cookieToken) {
    return getUserFromSessionToken(cookieToken);
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  return getUserFromSessionToken(token);
};
