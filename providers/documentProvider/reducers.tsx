import { handleActions } from "redux-actions";
import type { IDocumentItem } from "@/providers/domainSeeds";

import { DocumentActionEnums } from "./actions";
import { INITIAL_STATE, type IDocumentStateContext } from "./context";

export const DocumentReducer = handleActions<IDocumentStateContext, IDocumentItem | string | undefined>(
  {
    [DocumentActionEnums.add]: (state, action) => ({
      ...state,
      documents: [...state.documents, action.payload as IDocumentItem],
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [DocumentActionEnums.delete]: (state, action) => ({
      ...state,
      documents: state.documents.filter((item) => item.id !== (action.payload as string)),
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [DocumentActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [DocumentActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [DocumentActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  INITIAL_STATE,
);
