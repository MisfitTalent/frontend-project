import "server-only";

import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

type PersistedLocalState = {
  mockUserStore: {
    nextId: number;
    users: Record<string, unknown>;
  };
  mockWorkspaceStore: Record<string, unknown>;
  schema: "autosales-local-state-v1";
  serviceRequestStore: Record<string, unknown>;
};

const LOCAL_STATE_DIR = path.join(process.cwd(), ".local-state");
const LOCAL_STATE_FILE = path.join(LOCAL_STATE_DIR, "assistant-workflow.json");
const TEMP_STATE_FILE = `${LOCAL_STATE_FILE}.tmp`;

let cachedState: PersistedLocalState | null = null;

const clone = <T,>(value: T): T => structuredClone(value);

const createEmptyState = (): PersistedLocalState => ({
  mockUserStore: {
    nextId: 1,
    users: {},
  },
  mockWorkspaceStore: {},
  schema: "autosales-local-state-v1",
  serviceRequestStore: {},
});

const normalizePersistedState = (value: unknown): PersistedLocalState => {
  if (!value || typeof value !== "object") {
    return createEmptyState();
  }

  const candidate = value as Partial<PersistedLocalState>;

  if (candidate.schema !== "autosales-local-state-v1") {
    return createEmptyState();
  }

  return {
    mockUserStore:
      candidate.mockUserStore &&
      typeof candidate.mockUserStore === "object" &&
      candidate.mockUserStore.users &&
      typeof candidate.mockUserStore.users === "object"
        ? {
            nextId:
              typeof candidate.mockUserStore.nextId === "number" &&
              Number.isFinite(candidate.mockUserStore.nextId)
                ? Math.max(1, Math.floor(candidate.mockUserStore.nextId))
                : 1,
            users: candidate.mockUserStore.users,
          }
        : {
            nextId: 1,
            users: {},
          },
    mockWorkspaceStore:
      candidate.mockWorkspaceStore && typeof candidate.mockWorkspaceStore === "object"
        ? candidate.mockWorkspaceStore
        : {},
    schema: "autosales-local-state-v1",
    serviceRequestStore:
      candidate.serviceRequestStore && typeof candidate.serviceRequestStore === "object"
        ? candidate.serviceRequestStore
        : {},
  };
};

const ensureLocalStateDir = () => {
  if (!existsSync(LOCAL_STATE_DIR)) {
    mkdirSync(LOCAL_STATE_DIR, { recursive: true });
  }
};

const readMutableState = () => {
  if (cachedState) {
    return cachedState;
  }

  if (!existsSync(LOCAL_STATE_FILE)) {
    cachedState = createEmptyState();
    return cachedState;
  }

  try {
    const raw = readFileSync(LOCAL_STATE_FILE, "utf8");
    cachedState = normalizePersistedState(JSON.parse(raw));
    return cachedState;
  } catch {
    cachedState = createEmptyState();
    return cachedState;
  }
};

const flushState = (state: PersistedLocalState) => {
  ensureLocalStateDir();
  writeFileSync(TEMP_STATE_FILE, JSON.stringify(state, null, 2), "utf8");

  if (existsSync(LOCAL_STATE_FILE)) {
    unlinkSync(LOCAL_STATE_FILE);
  }

  renameSync(TEMP_STATE_FILE, LOCAL_STATE_FILE);
};

export const readLocalStateSnapshot = () => clone(readMutableState());

export const writeLocalStateSnapshot = (patch: (state: PersistedLocalState) => void) => {
  const state = readMutableState();
  patch(state);

  try {
    flushState(state);
  } catch {
    try {
      unlinkSync(TEMP_STATE_FILE);
    } catch {
      // Ignore cleanup failures.
    }
  }

  return clone(state);
};
