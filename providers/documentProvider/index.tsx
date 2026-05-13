"use client";

import { useContext, useEffect, useMemo, useReducer } from "react";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { useAuthState } from "@/providers/authProvider";
import { initialDocuments, type IDocumentItem } from "@/providers/domainSeeds";
import {
  addDocumentAction,
  deleteDocumentAction,
  replaceDocumentsAction,
} from "./actions";
import { DocumentActionContext, DocumentStateContext } from "./context";
import { DocumentReducer } from "./reducers";

const createDocumentStorageKey = (tenantId?: string | null) =>
  `autosales:documents:${tenantId?.trim() || "default"}`;

const readStoredDocuments = (storageKey: string) => {
  if (typeof window === "undefined") {
    return initialDocuments();
  }

  const fallback = initialDocuments();
  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as IDocumentItem[];

    if (!Array.isArray(parsed)) {
      return fallback;
    }

    const merged = [...fallback];
    const seenIds = new Set(fallback.map((item) => item.id));

    parsed.forEach((item) => {
      if (!item || typeof item !== "object" || typeof item.id !== "string") {
        return;
      }

      if (seenIds.has(item.id)) {
        return;
      }

      merged.push(item);
      seenIds.add(item.id);
    });

    return merged;
  } catch {
    return fallback;
  }
};

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
  const storageKey = useMemo(
    () => createDocumentStorageKey(user?.tenantId),
    [user?.tenantId],
  );
  const [state, dispatch] = useReducer(DocumentReducer, {
    documents: initialDocuments(),
  });

  useEffect(() => {
    dispatch(replaceDocumentsAction(readStoredDocuments(storageKey)));
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(state.documents));
  }, [state.documents, storageKey]);

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
