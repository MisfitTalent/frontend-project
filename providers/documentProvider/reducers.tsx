import type { IDocumentItem } from "@/providers/domainSeeds";

import { DocumentActionEnums } from "./actions";
import { INITIAL_STATE, type IDocumentStateContext } from "./context";

type DocumentAction =
  | { payload: IDocumentItem; type: DocumentActionEnums.add }
  | { payload: string; type: DocumentActionEnums.delete }
  | { payload: IDocumentItem[]; type: DocumentActionEnums.set };

export const DocumentReducer = (
  state: IDocumentStateContext = INITIAL_STATE,
  action: DocumentAction,
): IDocumentStateContext => {
  switch (action.type) {
    case DocumentActionEnums.add:
      return { ...state, documents: [...state.documents, action.payload] };
    case DocumentActionEnums.delete:
      return {
        ...state,
        documents: state.documents.filter((item) => item.id !== action.payload),
      };
    case DocumentActionEnums.set:
      return {
        ...state,
        documents: action.payload,
      };
    default:
      return state;
  }
};
