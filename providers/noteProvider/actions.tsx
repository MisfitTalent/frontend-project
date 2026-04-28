import type { INoteItem } from "@/providers/domainSeeds";

export enum NoteActionEnums {
  add = "ADD_NOTE",
  delete = "DELETE_NOTE",
  update = "UPDATE_NOTE",
}

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

export const updateNoteAction = (payload: Partial<INoteItem> & { id: string }) =>
  ({
    payload,
    type: NoteActionEnums.update,
  }) as const;
