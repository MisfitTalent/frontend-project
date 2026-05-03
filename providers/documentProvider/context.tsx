import { createContext } from "react";

import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import type { IDocumentItem } from "@/providers/domainSeeds";

export interface IDocumentStateContext {
  documents: IDocumentItem[];
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
}

export interface IDocumentActionContext {
  addDocument: (payload: IDocumentItem) => void;
  deleteDocument: (id: string) => void;
}

export const INITIAL_STATE: IDocumentStateContext = {
  documents: [],
  ...PROVIDER_REQUEST_IDLE,
};

export const DocumentStateContext = createContext<IDocumentStateContext | undefined>(
  undefined,
);

export const DocumentActionContext = createContext<IDocumentActionContext | undefined>(
  undefined,
);
