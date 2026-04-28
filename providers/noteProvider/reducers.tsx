import type { INoteItem } from "@/providers/domainSeeds";

import { NoteActionEnums } from "./actions";
import { INITIAL_STATE, type INoteStateContext } from "./context";

type NoteAction =
  | { payload: INoteItem; type: NoteActionEnums.add }
  | { payload: string; type: NoteActionEnums.delete }
  | { payload: Partial<INoteItem> & { id: string }; type: NoteActionEnums.update };

export const NoteReducer = (
  state: INoteStateContext = INITIAL_STATE,
  action: NoteAction,
): INoteStateContext => {
  switch (action.type) {
    case NoteActionEnums.add:
      return { notes: [...state.notes, action.payload] };
    case NoteActionEnums.update:
      return {
        notes: state.notes.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item,
        ),
      };
    case NoteActionEnums.delete:
      return { notes: state.notes.filter((item) => item.id !== action.payload) };
    default:
      return state;
  }
};
