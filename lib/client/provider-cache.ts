const providerCache = new Map<string, unknown>();

export const createProviderCacheKey = (...parts: Array<string | null | undefined>) =>
  parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join("::");

export const readProviderCache = <T>(key: string) =>
  (providerCache.get(key) as T | undefined) ?? undefined;

export const writeProviderCache = <T>(key: string, value: T) => {
  providerCache.set(key, value);
  return value;
};
