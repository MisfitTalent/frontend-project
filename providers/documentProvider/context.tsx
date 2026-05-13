"use client";

import { createContext } from "react";

import type { IDocumentItem } from "@/providers/domainSeeds";

export interface ICreateDocumentPayload {
  clientId: string;
  file: File;
}

export interface IDocumentStateContext {
  documents: IDocumentItem[];
  isLoading: boolean;
}

export interface IDocumentActionContext {
  addDocument: (payload: ICreateDocumentPayload) => Promise<IDocumentItem>;
  deleteDocument: (id: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

export const INITIAL_STATE: IDocumentStateContext = {
  documents: [],
  isLoading: false,
};

export const DocumentStateContext = createContext<IDocumentStateContext | undefined>(
  undefined,
);

export const DocumentActionContext = createContext<IDocumentActionContext | undefined>(
  undefined,
);
