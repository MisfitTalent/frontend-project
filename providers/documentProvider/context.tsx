"use client";

import { createContext } from "react";

import type { IDocumentItem } from "@/providers/domainSeeds";

export interface IDocumentStateContext {
  documents: IDocumentItem[];
}

export interface IDocumentActionContext {
  addDocument: (payload: IDocumentItem) => void;
  deleteDocument: (id: string) => void;
}

export const INITIAL_STATE: IDocumentStateContext = {
  documents: [],
};

export const DocumentStateContext = createContext<IDocumentStateContext | undefined>(
  undefined,
);

export const DocumentActionContext = createContext<IDocumentActionContext | undefined>(
  undefined,
);
