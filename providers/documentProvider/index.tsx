"use client";

import { useContext, useReducer } from "react";

import { initialDocuments, type IDocumentItem } from "@/providers/domainSeeds";
import { addDocumentAction, deleteDocumentAction } from "./actions";
import { DocumentActionContext, DocumentStateContext } from "./context";
import { DocumentReducer } from "./reducers";

export const useDocumentState = () => {
  const context = useContext(DocumentStateContext);

  if (context === undefined) {
    throw new Error("useDocumentState must be used within DocumentProvider.");
  }

  return context;
};

export const useDocumentActions = () => {
  const context = useContext(DocumentActionContext);

  if (context === undefined) {
    throw new Error("useDocumentActions must be used within DocumentProvider.");
  }

  return context;
};

export default function DocumentProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(DocumentReducer, {
    documents: initialDocuments(),
  });

  return (
    <DocumentStateContext.Provider value={state}>
      <DocumentActionContext.Provider
        value={{
          addDocument: (payload: IDocumentItem) => dispatch(addDocumentAction(payload)),
          deleteDocument: (id) => dispatch(deleteDocumentAction(id)),
        }}
      >
        {children}
      </DocumentActionContext.Provider>
    </DocumentStateContext.Provider>
  );
}
