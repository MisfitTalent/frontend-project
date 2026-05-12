"use client";

type DraftStorageKind = "local" | "session";

const getStorage = (storage: DraftStorageKind) => {
  if (typeof window === "undefined") {
    return null;
  }

  return storage === "local" ? window.localStorage : window.sessionStorage;
};

export const readSessionDraft = <T,>(
  key: string,
  options: { storage?: DraftStorageKind } = {},
): T | null => {
  const storage = getStorage(options.storage ?? "session");

  if (!storage) {
    return null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = storage.getItem(key);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
};

export const writeSessionDraft = (
  key: string,
  value: unknown,
  options: { storage?: DraftStorageKind } = {},
) => {
  const storage = getStorage(options.storage ?? "session");

  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures so drafts do not break the UI.
  }
};

export const clearSessionDraft = (
  key: string,
  options: { storage?: DraftStorageKind } = {},
) => {
  const storage = getStorage(options.storage ?? "session");

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage failures so cleanup does not break the UI.
  }
};
