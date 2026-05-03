import { createContext } from "react";

import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import type { INoteItem } from "@/providers/domainSeeds";

export interface INoteStateContext {
  notes: INoteItem[];
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
}

export interface INoteActionContext {
  addNote: (payload: INoteItem) => Promise<INoteItem>;
  deleteNote: (id: string) => Promise<void>;
  updateNote: (id: string, payload: Partial<INoteItem>) => Promise<INoteItem | undefined>;
}

export const INITIAL_STATE: INoteStateContext = {
  notes: [],
  ...PROVIDER_REQUEST_IDLE,
};

export const NoteStateContext = createContext<INoteStateContext | undefined>(undefined);

export const NoteActionContext = createContext<INoteActionContext | undefined>(undefined);
