import { handleActions } from "redux-actions";
import type { INoteItem } from "@/providers/domainSeeds";

import { NoteActionEnums } from "./actions";
import { INITIAL_STATE, type INoteStateContext } from "./context";

type NotePayload = INoteItem | INoteItem[] | string | (Partial<INoteItem> & { id: string }) | undefined;

export const NoteReducer = handleActions<INoteStateContext, NotePayload>(
  {
    [NoteActionEnums.add]: (state, action) => ({
      ...state,
      notes: [...state.notes, action.payload as INoteItem],
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [NoteActionEnums.set]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      notes: action.payload as INoteItem[],
    }),
    [NoteActionEnums.update]: (state, action) => ({
      ...state,
      notes: state.notes.map((item) =>
        item.id === (action.payload as Partial<INoteItem> & { id: string }).id
          ? { ...item, ...(action.payload as Partial<INoteItem> & { id: string }) }
          : item,
      ),
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [NoteActionEnums.delete]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      notes: state.notes.filter((item) => item.id !== (action.payload as string)),
    }),
    [NoteActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [NoteActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [NoteActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  INITIAL_STATE,
);
