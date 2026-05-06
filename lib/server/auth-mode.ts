import "server-only";

export const shouldUseUpstreamAuth = () =>
  process.env.ENABLE_UPSTREAM_AUTH?.trim().toLowerCase() === "true";
