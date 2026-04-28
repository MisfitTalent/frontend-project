import type { IDocumentItem } from "@/providers/domainSeeds";

export enum DocumentActionEnums {
  add = "ADD_DOCUMENT",
  delete = "DELETE_DOCUMENT",
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
