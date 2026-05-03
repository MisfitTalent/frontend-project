import type { IDocumentItem } from "@/providers/domainSeeds";

export enum DocumentActionEnums {
  add = "ADD_DOCUMENT",
  delete = "DELETE_DOCUMENT",
  error = "DOCUMENT_ERROR",
  pending = "DOCUMENT_PENDING",
  success = "DOCUMENT_SUCCESS",
}

export const documentPendingAction = () =>
  ({
    payload: undefined,
    type: DocumentActionEnums.pending,
  }) as const;

export const documentSuccessAction = () =>
  ({
    payload: undefined,
    type: DocumentActionEnums.success,
  }) as const;

export const documentErrorAction = () =>
  ({
    payload: undefined,
    type: DocumentActionEnums.error,
  }) as const;

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
