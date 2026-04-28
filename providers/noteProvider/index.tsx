"use client";

import { useContext, useReducer } from "react";

import { initialNotes } from "@/providers/domainSeeds";
import { addNoteAction, deleteNoteAction, updateNoteAction } from "./actions";
import { NoteActionContext, NoteStateContext } from "./context";
import { NoteReducer } from "./reducers";

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
  const [state, dispatch] = useReducer(NoteReducer, { notes: initialNotes() });

  return (
    <NoteStateContext.Provider value={state}>
      <NoteActionContext.Provider
        value={{
          addNote: (payload) => dispatch(addNoteAction(payload)),
          deleteNote: (id) => dispatch(deleteNoteAction(id)),
          updateNote: (id, payload) =>
            dispatch(updateNoteAction({ id, ...payload })),
        }}
      >
        {children}
      </NoteActionContext.Provider>
    </NoteStateContext.Provider>
  );
}
