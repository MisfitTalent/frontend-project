export const AUTH_COOKIE_NAME = "autosales_session";

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 60 * 60 * 8,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
