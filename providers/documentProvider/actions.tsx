import type { IDocumentItem } from "@/providers/domainSeeds";

export enum DocumentActionEnums {
  add = "ADD_DOCUMENT",
  delete = "DELETE_DOCUMENT",
  set = "SET_DOCUMENTS",
}

export const addDocumentAction = (payload: IDocumentItem) =>
  ({
    payload,
    type: DocumentActionEnums.add,
  }) as const;

export const deleteDocumentAction = (payload: string) =>
  ({
    payload,
    type: DocumentActionEnums.delete,
  }) as const;

export const setDocumentsAction = (payload: IDocumentItem[]) =>
  ({
    payload,
    type: DocumentActionEnums.set,
  }) as const;
