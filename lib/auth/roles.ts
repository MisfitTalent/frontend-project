export type UserRole =
  | "Admin"
  | "SalesManager"
  | "BusinessDevelopmentManager"
  | "SalesRep";

const ROLE_ALIASES: Record<string, UserRole> = {
  admin: "Admin",
  businessdevelopmentmanager: "BusinessDevelopmentManager",
  client: "SalesRep",
  salesmanager: "SalesManager",
  salesrep: "SalesRep",
};

export const normalizeUserRole = (value?: string | null): UserRole => {
  const key = value?.replace(/\s+/g, "").trim().toLowerCase() ?? "";

  return ROLE_ALIASES[key] ?? "SalesRep";
};

export const getPrimaryUserRole = (
  roles?: string[] | null,
  fallback?: string | null,
): UserRole => normalizeUserRole(roles?.[0] ?? fallback ?? null);

export const isManagerRole = (role: UserRole) =>
  role === "Admin" || role === "SalesManager";

export const isAdminRole = (role: UserRole) => role === "Admin";

export const getUserRoleLabel = (role: UserRole) => {
  switch (role) {
    case "Admin":
      return "Administrator";
    case "SalesManager":
      return "Sales Manager";
    case "BusinessDevelopmentManager":
      return "Business Development Manager";
    case "SalesRep":
    default:
      return "Sales Rep";
  }
};
