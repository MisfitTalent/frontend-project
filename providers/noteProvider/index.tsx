"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import {
  backendRequest,
  coerceItems,
  getSessionToken,
  isMockSessionToken,
} from "@/lib/client/backend-api";
import { createProviderCacheKey, readProviderCache, writeProviderCache } from "@/lib/client/provider-cache";
import { useAuthState } from "@/providers/authProvider";
import { initialNotes, type INoteItem } from "@/providers/domainSeeds";
import { NoteActionContext, NoteStateContext } from "./context";

export const useNoteState = () => {
  const context = useContext(NoteStateContext);

  if (context === undefined) {
    throw new Error("useNoteState must be used within NoteProvider.");
  }

  return context;
};

export const useNoteActions = () => {
  const context = useContext(NoteActionContext);

  if (context === undefined) {
    throw new Error("useNoteActions must be used within NoteProvider.");
  }

  return context;
};

export default function NoteProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, user } = useAuthState();
  const isDemoMode = isMockSessionToken(getSessionToken());
  const scopedClientIds = useMemo(() => new Set(user?.clientIds ?? []), [user?.clientIds]);
  const isScopedClient = isClientScopedUser(user?.clientIds);
  const cacheKey = useMemo(
    () => createProviderCacheKey("notes", user?.tenantId, user?.userId),
    [user?.tenantId, user?.userId],
  );
  const cachedNotes = useMemo(() => readProviderCache<INoteItem[]>(cacheKey), [cacheKey]);
  const [notes, setNotes] = useState<INoteItem[]>(
    () => cachedNotes ?? [],
  );

  const scopeNotes = useCallback(
    (items: INoteItem[]) =>
      isScopedClient
        ? items.filter((note) => Boolean(note.clientId) && scopedClientIds.has(note.clientId as string))
        : items,
    [isScopedClient, scopedClientIds],
  );

  const loadNotes = useCallback(async () => {
    const payload = await backendRequest<{ items?: INoteItem[] } | INoteItem[]>("/api/Notes");
    setNotes(writeProviderCache(cacheKey, scopeNotes(coerceItems(payload))));
  }, [cacheKey, scopeNotes]);

  useEffect(() => {
    writeProviderCache(cacheKey, notes);
  }, [cacheKey, notes]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isActive = true;
    let pollTimer: number | null = null;

    const schedulePolling = () => {
      if (!isDemoMode) {
        return;
      }

      pollTimer = window.setInterval(() => {
        void loadNotes().catch((error) => {
          console.error(error);
        });
      }, 5000);
    };

    if (isDemoMode) {
      const timer = window.setTimeout(() => {
        void loadNotes().catch((error) => {
          console.error(error);

          if (isActive) {
            setNotes(writeProviderCache(cacheKey, scopeNotes(initialNotes())));
          }
        });
      }, 0);

      const handleWorkspaceUpdate = () => {
        void loadNotes().catch((error) => {
          console.error(error);
        });
      };

      schedulePolling();
      window.addEventListener("mock-workspace-updated", handleWorkspaceUpdate);

      return () => {
        isActive = false;
        window.clearTimeout(timer);
        if (pollTimer !== null) {
          window.clearInterval(pollTimer);
        }
        window.removeEventListener("mock-workspace-updated", handleWorkspaceUpdate);
      };
    }

    const timer = window.setTimeout(() => {
      void loadNotes().catch((error) => {
        console.error(error);
      });
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [cacheKey, isAuthenticated, isDemoMode, loadNotes, scopeNotes]);

  return (
    <NoteStateContext.Provider value={{ notes: isAuthenticated ? notes : [] }}>
      <NoteActionContext.Provider
        value={{
          addNote: (payload) => {
            void backendRequest<INoteItem>("/api/Notes", {
              body: JSON.stringify(payload),
              method: "POST",
            })
              .then((note) => {
                setNotes((current) => [...current, note]);
              })
              .catch((error) => {
                console.error(error);
              });
          },
          deleteNote: (id) => {
            void backendRequest<void>(`/api/Notes/${id}`, {
              method: "DELETE",
            })
              .then(() => {
                setNotes((current) => current.filter((item) => item.id !== id));
              })
              .catch((error) => {
                console.error(error);
              });
          },
          updateNote: (id, payload) => {
            void backendRequest<INoteItem>(`/api/Notes/${id}`, {
              body: JSON.stringify(payload),
              method: "PUT",
            })
              .then((note) => {
                setNotes((current) =>
                  current.map((item) => (item.id === id ? note : item)),
                );
              })
              .catch((error) => {
                console.error(error);
              });
          },
        }}
      >
        {children}
      </NoteActionContext.Provider>
    </NoteStateContext.Provider>
  );
}
