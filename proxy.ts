import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/app/api/Auth/session-cookie";
import { canAccessDashboardPath, DASHBOARD_HOME_PATH } from "@/lib/auth/dashboard-access";
import { normalizeUserRole } from "@/lib/auth/roles";
import { getUserFromSessionToken } from "@/lib/auth/session-user";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = getUserFromSessionToken(token);

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!canAccessDashboardPath(pathname, normalizeUserRole(user.role), user.clientIds)) {
    return NextResponse.redirect(new URL(DASHBOARD_HOME_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
