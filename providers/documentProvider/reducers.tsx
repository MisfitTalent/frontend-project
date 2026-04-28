import type { IDocumentItem } from "@/providers/domainSeeds";

import { DocumentActionEnums } from "./actions";
import { INITIAL_STATE, type IDocumentStateContext } from "./context";

type DocumentAction =
  | { payload: IDocumentItem; type: DocumentActionEnums.add }
  | { payload: string; type: DocumentActionEnums.delete };

export const DocumentReducer = (
  state: IDocumentStateContext = INITIAL_STATE,
  action: DocumentAction,
): IDocumentStateContext => {
  switch (action.type) {
    case DocumentActionEnums.add:
      return { documents: [...state.documents, action.payload] };
    case DocumentActionEnums.delete:
      return {
        documents: state.documents.filter((item) => item.id !== action.payload),
      };
    default:
      return state;
  }
};
