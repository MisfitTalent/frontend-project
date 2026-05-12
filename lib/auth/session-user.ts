import { getUserFromToken, type IMockUser, type MockUserRole } from "@/app/api/Auth/mock-users";
import { normalizeUserRole } from "@/lib/auth/roles";

type JwtPayload = Record<string, unknown>;

const decodeJwtPayload = (token: string): JwtPayload | null => {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = Buffer.from(padded, "base64").toString("utf8");

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

const readStringClaim = (payload: JwtPayload, keys: string[]) => {
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const readStringArrayClaim = (payload: JwtPayload, keys: string[]) => {
  for (const key of keys) {
    const value = payload[key];

    if (Array.isArray(value)) {
      const items = value.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      );

      if (items.length > 0) {
        return items.map((item) => item.trim());
      }
    }

    if (typeof value === "string" && value.trim()) {
      const items = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (items.length > 0) {
        return items;
      }
    }
  }

  return [];
};

const readRoleClaim = (payload: JwtPayload): MockUserRole => {
  const candidates = [
    payload.role,
    payload.roles,
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return normalizeUserRole(candidate);
    }

    if (Array.isArray(candidate)) {
      const role = candidate.find(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      );

      if (role) {
        return normalizeUserRole(role);
      }
    }
  }

  return "SalesRep";
};

const getJwtUserFromToken = (token: string): IMockUser | null => {
  const payload = decodeJwtPayload(token);

  if (!payload) {
    return null;
  }

  const email = readStringClaim(payload, [
    "email",
    "upn",
    "unique_name",
    "preferred_username",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  ]);

  if (!email) {
    return null;
  }

  const firstName =
    readStringClaim(payload, [
      "given_name",
      "firstName",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
    ]) ?? "";
  const lastName =
    readStringClaim(payload, [
      "family_name",
      "lastName",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
    ]) ?? "";
  const fullName =
    readStringClaim(payload, [
      "name",
      "fullName",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    ]) ?? "";
  const [fallbackFirstName, ...fallbackLastNameParts] = fullName.split(" ").filter(Boolean);

  return {
    clientIds: readStringArrayClaim(payload, [
      "clientIds",
      "client_ids",
      "clients",
      "clientScope",
    ]),
    email,
    firstName: firstName || fallbackFirstName || email,
    id:
      readStringClaim(payload, [
        "sub",
        "nameid",
        "userId",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
      ]) ?? email,
    lastName: lastName || fallbackLastNameParts.join(" "),
    password: "",
    role: readRoleClaim(payload),
    tenantId: readStringClaim(payload, ["tenantId", "tid"]) ?? "external-tenant",
    tenantName: readStringClaim(payload, ["tenantName"]) ?? "External Workspace",
  };
};

export const getUserFromSessionToken = (token: string): IMockUser | null =>
  getUserFromToken(token) ?? getJwtUserFromToken(token) ?? null;
