"use client";

import { useCallback, useContext, useEffect, useState } from "react";

import {
  backendRequest,
  coerceItems,
  getSessionToken,
  isMockSessionToken,
} from "@/lib/client/backend-api";
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
  const { isAuthenticated } = useAuthState();
  const [notes, setNotes] = useState<INoteItem[]>([]);
  const isDemoMode = isMockSessionToken(getSessionToken());

  const loadNotes = useCallback(async () => {
    const payload = await backendRequest<{ items?: INoteItem[] } | INoteItem[]>("/api/Notes");
    setNotes(coerceItems(payload));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isActive = true;

    if (isDemoMode) {
      const timer = window.setTimeout(() => {
        void loadNotes().catch((error) => {
          console.error(error);

          if (isActive) {
            setNotes(initialNotes());
          }
        });
      }, 0);

      const handleWorkspaceUpdate = () => {
        void loadNotes().catch((error) => {
          console.error(error);
        });
      };

      window.addEventListener("mock-workspace-updated", handleWorkspaceUpdate);

      return () => {
        isActive = false;
        window.clearTimeout(timer);
        window.removeEventListener("mock-workspace-updated", handleWorkspaceUpdate);
      };
    }

    void loadNotes().catch((error) => {
      console.error(error);
    });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, isDemoMode, loadNotes]);

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
