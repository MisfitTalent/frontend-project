"use client";

import { createContext } from "react";

import type { INoteItem } from "@/providers/domainSeeds";

export interface INoteStateContext {
  notes: INoteItem[];
}

export interface INoteActionContext {
  addNote: (payload: INoteItem) => void;
  deleteNote: (id: string) => void;
  updateNote: (id: string, payload: Partial<INoteItem>) => void;
}

export const INITIAL_STATE: INoteStateContext = {
  notes: [],
};

export const NoteStateContext = createContext<INoteStateContext | undefined>(undefined);

export const NoteActionContext = createContext<INoteActionContext | undefined>(undefined);
