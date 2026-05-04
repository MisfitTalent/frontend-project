export const AUTH_COOKIE_NAME = "autosales_session";

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 60 * 60 * 8,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export const sanitizeAuthPayload = <T extends { token?: string | null }>(payload: T) => {
  const token = typeof payload.token === "string" ? payload.token : "";

  return {
    ...payload,
    isMockSession: token.startsWith("mock-token::"),
    token: null,
  };
};
