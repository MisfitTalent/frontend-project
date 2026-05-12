"use client";

import { useContext, useMemo, useReducer } from "react";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { useAuthState } from "@/providers/authProvider";
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
  const { user } = useAuthState();
  const isScopedClient = isClientScopedUser(user?.clientIds);
  const scopedClientIds = useMemo(() => new Set(user?.clientIds ?? []), [user?.clientIds]);
  const [state, dispatch] = useReducer(DocumentReducer, {
    documents: initialDocuments(),
  });
  const documents = useMemo(
    () =>
      isScopedClient
        ? state.documents.filter(
            (document) => Boolean(document.clientId) && scopedClientIds.has(document.clientId as string),
          )
        : state.documents,
    [isScopedClient, scopedClientIds, state.documents],
  );

  return (
    <DocumentStateContext.Provider value={{ documents }}>
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
