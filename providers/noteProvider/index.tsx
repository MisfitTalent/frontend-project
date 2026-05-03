"use client";
import { useContext, useEffect, useReducer } from "react";
import { type BackendPagedResult, backendRequest, coerceItems, } from "@/lib/client/backend-api";
import { clearSessionDraft } from "@/lib/client/session-drafts";
import { useAuthState } from "@/providers/authProvider";
import { initialNotes } from "@/providers/domainSeeds";
import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import { addNoteAction, deleteNoteAction, noteErrorAction, notePendingAction, setNotesAction, updateNoteAction, } from "./actions";
import { INITIAL_STATE, NoteActionContext, NoteStateContext } from "./context";
import { NoteReducer } from "./reducers";
const NOTES_SESSION_KEY = "dashboard.notes.session";
type NoteRecord = ReturnType<typeof initialNotes>[number];
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
export const NoteProvider = ({ children, }: Readonly<{
    children: React.ReactNode;
}>) => {
    const { isAuthenticated, user } = useAuthState();
    const [state, dispatch] = useReducer(NoteReducer, undefined, () => ({
        ...INITIAL_STATE,
        notes: initialNotes(),
    }));
    const isDemoMode = Boolean(user?.isMockSession);
    const notes = state.notes;
    useEffect(() => {
        clearSessionDraft(NOTES_SESSION_KEY);
    }, []);
    useEffect(() => {
        if (!isAuthenticated || !isDemoMode) {
            return;
        }
        let isActive = true;
        const loadNotes = async () => {
            dispatch(notePendingAction());
            try {
                const payload = await backendRequest<BackendPagedResult<ReturnType<typeof initialNotes>[number]> | ReturnType<typeof initialNotes>>("/api/Notes");
                if (!isActive) {
                    return;
                }
                dispatch(setNotesAction(coerceItems(payload)));
            }
            catch (error) {
                console.error(error);
                if (isActive) {
                    dispatch(noteErrorAction());
                }
            }
        };
        void loadNotes();
        return () => {
            isActive = false;
        };
    }, [isAuthenticated, isDemoMode]);
    useEffect(() => {
        const handleWorkspaceUpdate = (event: Event) => {
            const mutations = (event as CustomEvent<Array<{
                entityId: string;
                entityType: string;
                operation: string;
                record?: unknown;
            }>>).detail;
            if (!Array.isArray(mutations)) {
                return;
            }
            for (const mutation of mutations) {
                if (mutation.entityType !== "note") {
                    continue;
                }
                if (mutation.operation === "delete") {
                    dispatch(deleteNoteAction(mutation.entityId));
                    continue;
                }
                if ((mutation.operation === "create" || mutation.operation === "update") &&
                    mutation.record &&
                    typeof mutation.record === "object") {
                    const record = mutation.record as NoteRecord;
                    const exists = notes.some((note) => note.id === record.id);
                    dispatch(exists ? updateNoteAction(record) : addNoteAction(record));
                }
            }
        };
        window.addEventListener("mock-workspace-updated", handleWorkspaceUpdate);
        return () => {
            window.removeEventListener("mock-workspace-updated", handleWorkspaceUpdate);
        };
    }, [notes]);
    return (<NoteStateContext.Provider value={isAuthenticated ? state : { ...state, ...PROVIDER_REQUEST_IDLE }}>
      <NoteActionContext.Provider value={{
            addNote: async (payload) => {
                dispatch(notePendingAction());
                try {
                    if (isDemoMode) {
                        const note = await backendRequest<ReturnType<typeof initialNotes>[number]>("/api/Notes", {
                            body: JSON.stringify(payload),
                            method: "POST",
                        });
                        dispatch(addNoteAction(note));
                        return note;
                    }
                    dispatch(addNoteAction(payload));
                    return payload;
                }
                catch (error) {
                    dispatch(noteErrorAction());
                    throw error;
                }
            },
            deleteNote: async (id) => {
                dispatch(notePendingAction());
                try {
                    if (isDemoMode) {
                        await backendRequest<void>(`/api/Notes/${id}`, {
                            method: "DELETE",
                        });
                    }
                    dispatch(deleteNoteAction(id));
                }
                catch (error) {
                    dispatch(noteErrorAction());
                    throw error;
                }
            },
            updateNote: async (id, payload) => {
                dispatch(notePendingAction());
                try {
                    if (isDemoMode) {
                        const note = await backendRequest<ReturnType<typeof initialNotes>[number]>(`/api/Notes/${id}`, {
                            body: JSON.stringify(payload),
                            method: "PUT",
                        });
                        dispatch(updateNoteAction(note));
                        return note;
                    }
                    const existing = notes.find((note) => note.id === id);
                    if (!existing) {
                        return undefined;
                    }
                    const nextNote = { ...existing, ...payload, id };
                    dispatch(updateNoteAction(nextNote));
                    return nextNote;
                }
                catch (error) {
                    dispatch(noteErrorAction());
                    throw error;
                }
            },
        }}>
        {children}
      </NoteActionContext.Provider>
    </NoteStateContext.Provider>);
};
