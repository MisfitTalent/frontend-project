import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/app/api/Auth/session-cookie";
import type { AuthSessionUser } from "@/lib/auth/auth-contract";
import { canAccessDashboardPath, getDashboardHomePath } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole } from "@/lib/auth/roles";
import { getUserFromSessionToken } from "@/lib/auth/session-user";
import { createBackendUrl } from "@/lib/server/backend-url";

const toSessionUser = (user: ReturnType<typeof getUserFromSessionToken>): AuthSessionUser | null => {
  if (!user) {
    return null;
  }

  return {
    clientIds: user.clientIds ?? [],
    email: user.email,
    firstName: user.firstName,
    isMockSession: user.password === "",
    lastName: user.lastName,
    roles: [user.role],
    tenantId: user.tenantId,
    tenantName: user.tenantName,
    token: null,
    userId: user.id,
  };
};

const fetchAuthorizedSessionUser = async (token: string) => {
  const directUser = toSessionUser(getUserFromSessionToken(token));

  if (token.startsWith("mock-token::")) {
    return directUser;
  }

  try {
    const upstream = await fetch(createBackendUrl("/api/Auth/me"), {
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      redirect: "manual",
    });

    if (!upstream.ok || upstream.status === 204) {
      return directUser;
    }

    const payload = (await upstream.json()) as AuthSessionUser | null;

    return payload ?? directUser;
  } catch {
    return directUser;
  }
};

const redirectTo = (request: NextRequest, pathname: string) =>
  NextResponse.redirect(new URL(pathname, request.url));

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value?.trim();

  if (!token) {
    return redirectTo(request, "/login");
  }

  const sessionUser = await fetchAuthorizedSessionUser(token);

  if (!sessionUser) {
    return redirectTo(request, "/login");
  }

  const role = getPrimaryUserRole(sessionUser.roles);

  if (!canAccessDashboardPath(pathname, role, sessionUser.clientIds)) {
    return redirectTo(request, getDashboardHomePath(role, sessionUser.clientIds));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
