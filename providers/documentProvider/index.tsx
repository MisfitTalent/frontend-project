"use client";
import { useContext, useEffect, useMemo, useReducer } from "react";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { PROVIDER_REQUEST_SUCCESS } from "@/providers/provider-state";
import { clearSessionDraft } from "@/lib/client/session-drafts";
import { useAuthState } from "@/providers/authProvider";
import { initialDocuments, type IDocumentItem } from "@/providers/domainSeeds";
import { addDocumentAction, deleteDocumentAction } from "./actions";
import { DocumentActionContext, DocumentStateContext } from "./context";
import { DocumentReducer } from "./reducers";
const DOCUMENTS_SESSION_KEY = "dashboard.documents.session";
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
export const DocumentProvider = ({ children, }: Readonly<{
    children: React.ReactNode;
}>) => {
    const { user } = useAuthState();
    const [state, dispatch] = useReducer(DocumentReducer, undefined, () => ({
        documents: initialDocuments(),
        ...PROVIDER_REQUEST_SUCCESS,
    }));
    const isClientScoped = isClientScopedUser(user?.clientIds);
    const documents = useMemo(() => {
        if (!isClientScoped) {
            return state.documents;
        }
        const allowedClientIds = new Set(user?.clientIds ?? []);
        return state.documents.filter((document) => !document.clientId || allowedClientIds.has(document.clientId));
    }, [isClientScoped, state.documents, user?.clientIds]);
    useEffect(() => {
        clearSessionDraft(DOCUMENTS_SESSION_KEY);
    }, []);
    return (<DocumentStateContext.Provider value={{ ...state, documents }}>
      <DocumentActionContext.Provider value={{
            addDocument: (payload: IDocumentItem) => dispatch(addDocumentAction(payload)),
            deleteDocument: (id) => {
                dispatch(deleteDocumentAction(id));
            },
        }}>
        {children}
      </DocumentActionContext.Provider>
    </DocumentStateContext.Provider>);
};
