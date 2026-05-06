import { dashboardNavItems } from "@/constants/dashboard-nav";
import type { UserRole } from "@/providers/salesTypes";

export const DASHBOARD_HOME_PATH = "/dashboard";
const CLIENT_SCOPED_HOME_PATH = "/dashboard";

const CLIENT_SCOPED_ALLOWED_PATHS = [
  "/dashboard",
  "/dashboard/activities",
  "/dashboard/assistant",
  "/dashboard/contacts",
  "/dashboard/proposals",
  "/dashboard/documents",
  "/dashboard/messages",
  "/dashboard/contracts",
  "/dashboard/profile",
] as const;

const matchesScopedPath = (pathname: string, path: string) =>
  path === "/dashboard"
    ? pathname === path
    : pathname === path || pathname.startsWith(`${path}/`);

const isClientScopedPath = (pathname: string) =>
  CLIENT_SCOPED_ALLOWED_PATHS.some((path) => matchesScopedPath(pathname, path));

export const getDashboardNavItemForPath = (pathname: string) =>
  [...dashboardNavItems]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

export const isClientScopedUser = (clientIds?: string[] | null) =>
  Array.isArray(clientIds) && clientIds.length > 0;

export const getDashboardHomePath = (role: UserRole, clientIds?: string[] | null) =>
  isClientScopedUser(clientIds) ? CLIENT_SCOPED_HOME_PATH : DASHBOARD_HOME_PATH;

export const canAccessDashboardPath = (
  pathname: string,
  role: UserRole,
  clientIds?: string[] | null,
) => {
  if (isClientScopedUser(clientIds)) {
    return isClientScopedPath(pathname);
  }

  return getDashboardNavItemForPath(pathname)?.access.includes(role) ?? true;
};
