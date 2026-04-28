import { dashboardNavItems } from "@/constants/dashboard-nav";
import type { UserRole } from "@/providers/salesTypes";

export const DASHBOARD_HOME_PATH = "/dashboard";

const getNavItemForPath = (pathname: string) =>
  [...dashboardNavItems]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

export const canAccessDashboardPath = (pathname: string, role: UserRole) =>
  getNavItemForPath(pathname)?.access.includes(role) ?? true;
