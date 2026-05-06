import "server-only";

import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/app/api/Auth/session-cookie";

export const getRequestSessionToken = (request: NextRequest) => {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.slice("Bearer ".length).trim();
};

export const isLiveSessionToken = (token?: string | null) =>
  Boolean(token && !token.startsWith("mock-token::"));
