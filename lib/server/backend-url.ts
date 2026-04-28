export const getBackendBaseUrl = () => {
  const value = process.env.BACKEND_API_BASE_URL?.trim();

  if (!value) {
    throw new Error("BACKEND_API_BASE_URL is not configured.");
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export const createBackendUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return new URL(`${getBackendBaseUrl()}${normalizedPath}`);
};
