import type { INoteItem } from "@/providers/domainSeeds";

export enum NoteActionEnums {
  add = "ADD_NOTE",
  delete = "DELETE_NOTE",
  error = "NOTE_ERROR",
  pending = "NOTE_PENDING",
  set = "SET_NOTES",
  success = "NOTE_SUCCESS",
  update = "UPDATE_NOTE",
}

export const notePendingAction = () =>
  ({
    payload: undefined,
    type: NoteActionEnums.pending,
  }) as const;

export const noteSuccessAction = () =>
  ({
    payload: undefined,
    type: NoteActionEnums.success,
  }) as const;

export const noteErrorAction = () =>
  ({
    payload: undefined,
    type: NoteActionEnums.error,
  }) as const;

export const addNoteAction = (payload: INoteItem) =>
  ({
    payload,
    type: NoteActionEnums.add,
  }) as const;

export const deleteNoteAction = (payload: string) =>
  ({
    payload,
    type: NoteActionEnums.delete,
  }) as const;

export const setNotesAction = (payload: INoteItem[]) =>
  ({
    payload,
    type: NoteActionEnums.set,
  }) as const;

export const updateNoteAction = (payload: Partial<INoteItem> & { id: string }) =>
  ({
    payload,
    type: NoteActionEnums.update,
  }) as const;
