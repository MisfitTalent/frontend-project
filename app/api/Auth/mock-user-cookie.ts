import type { RequestCookies, ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

import type { IMockUser } from "./mock-users";

export const MOCK_USER_REGISTRY_COOKIE_NAME = "autosales_mock_users";

const MOCK_USER_REGISTRY_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

const encodeRegistry = (users: IMockUser[]) =>
  Buffer.from(JSON.stringify(users), "utf8").toString("base64url");

const decodeRegistry = (value: string) => {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(json);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isMockUser = (value: unknown): value is IMockUser => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<IMockUser>;

  return (
    typeof candidate.email === "string" &&
    typeof candidate.firstName === "string" &&
    typeof candidate.id === "string" &&
    typeof candidate.lastName === "string" &&
    typeof candidate.password === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.tenantId === "string" &&
    typeof candidate.tenantName === "string"
  );
};

export const readMockUsersFromCookies = (cookies: RequestCookies): IMockUser[] => {
  const value = cookies.get(MOCK_USER_REGISTRY_COOKIE_NAME)?.value;

  if (!value) {
    return [];
  }

  return decodeRegistry(value).filter(isMockUser).map((user) => ({
    ...user,
    clientIds: Array.isArray(user.clientIds)
      ? user.clientIds.filter((clientId): clientId is string => typeof clientId === "string")
      : [],
    email: user.email.trim().toLowerCase(),
  }));
};

export const writeMockUsersCookie = (
  cookies: ResponseCookies,
  users: IMockUser[],
) => {
  cookies.set(
    MOCK_USER_REGISTRY_COOKIE_NAME,
    encodeRegistry(users),
    MOCK_USER_REGISTRY_COOKIE_OPTIONS,
  );
};

export const upsertMockUserCookie = (
  cookies: ResponseCookies,
  existingUsers: IMockUser[],
  user: IMockUser,
) => {
  const normalizedEmail = user.email.trim().toLowerCase();
  const nextUsers = [
    ...existingUsers.filter((item) => item.email.trim().toLowerCase() !== normalizedEmail),
    { ...user, email: normalizedEmail },
  ];

  writeMockUsersCookie(cookies, nextUsers);
};
