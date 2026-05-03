"use client";
import { useCallback, useContext, useEffect, useReducer } from "react";
import { useAuthState } from "@/providers/authProvider";
import { type BackendContactDto, type BackendPagedResult, backendRequest, buildCreateContactPayload, buildUpdateContactPayload, coerceItems, mapBackendContact, } from "@/lib/client/backend-api";
import { initialContacts } from "@/providers/domainSeeds";
import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import { addContactAction, contactErrorAction, contactPendingAction, deleteContactAction, setContactsAction, updateContactAction, } from "./actions";
import { ContactActionContext, ContactStateContext, INITIAL_STATE } from "./context";
import { ContactReducer } from "./reducers";
export const useContactState = () => {
    const context = useContext(ContactStateContext);
    if (context === undefined) {
        throw new Error("useContactState must be used within ContactProvider.");
    }
    return context;
};
export const useContactActions = () => {
    const context = useContext(ContactActionContext);
    if (context === undefined) {
        throw new Error("useContactActions must be used within ContactProvider.");
    }
    return context;
};
type ContactProviderProps = Readonly<{
    children: React.ReactNode;
}>;
export const ContactProvider = ({ children, }: ContactProviderProps) => {
    const { isAuthenticated, user } = useAuthState();
    const [state, dispatch] = useReducer(ContactReducer, INITIAL_STATE);
    const isDemoMode = Boolean(user?.isMockSession);
    const loadContacts = useCallback(async () => {
        dispatch(contactPendingAction());
        const payload = await backendRequest<BackendPagedResult<BackendContactDto> | BackendContactDto[]>("/api/Contacts?pageNumber=1&pageSize=100");
        dispatch(setContactsAction(coerceItems(payload).map(mapBackendContact)));
    }, []);
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }
        let isActive = true;
        if (isDemoMode) {
            const timer = window.setTimeout(() => {
                void loadContacts().catch((error) => {
                    console.error(error);
                    if (isActive) {
                        dispatch(setContactsAction(initialContacts()));
                    }
                });
            }, 0);
            const handleWorkspaceUpdate = () => {
                void loadContacts().catch((error) => {
                    console.error(error);
                });
            };
            window.addEventListener("mock-workspace-updated", handleWorkspaceUpdate);
            return () => {
                isActive = false;
                window.clearTimeout(timer);
                window.removeEventListener("mock-workspace-updated", handleWorkspaceUpdate);
            };
        }
        const timer = window.setTimeout(() => {
            void loadContacts().catch((error) => {
                console.error(error);
                if (isActive) {
                    dispatch(contactErrorAction());
                }
            });
        }, 0);
        return () => {
            isActive = false;
            window.clearTimeout(timer);
        };
    }, [dispatch, isAuthenticated, isDemoMode, loadContacts]);
    return (<ContactStateContext.Provider value={{
            ...(isAuthenticated ? state : { ...state, ...PROVIDER_REQUEST_IDLE }),
            contacts: isAuthenticated ? state.contacts : [],
        }}>
      <ContactActionContext.Provider value={{
            addContact: async (payload) => {
                dispatch(contactPendingAction());
                try {
                    const response = await backendRequest<BackendContactDto>("/api/Contacts", {
                        body: JSON.stringify(buildCreateContactPayload(payload)),
                        method: "POST",
                    });
                    const nextContact = mapBackendContact(response);
                    dispatch(addContactAction(nextContact));
                    return nextContact;
                }
                catch (error) {
                    dispatch(contactErrorAction());
                    throw error;
                }
            },
            deleteContact: async (id) => {
                dispatch(contactPendingAction());
                try {
                    await backendRequest<void>(`/api/Contacts/${id}`, {
                        method: "DELETE",
                    });
                    dispatch(deleteContactAction(id));
                }
                catch (error) {
                    dispatch(contactErrorAction());
                    throw error;
                }
            },
            updateContact: async (id, payload) => {
                const existing = state.contacts.find((item) => item.id === id);
                if (!existing) {
                    return undefined;
                }
                const nextContact = { ...existing, ...payload };
                dispatch(contactPendingAction());
                try {
                    const response = await backendRequest<BackendContactDto>(`/api/Contacts/${id}`, {
                        body: JSON.stringify(buildUpdateContactPayload(nextContact)),
                        method: "PUT",
                    });
                    const mappedContact = mapBackendContact(response);
                    dispatch(updateContactAction(mappedContact));
                    return mappedContact;
                }
                catch (error) {
                    dispatch(contactErrorAction());
                    throw error;
                }
            },
        }}>
        {children}
      </ContactActionContext.Provider>
    </ContactStateContext.Provider>);
};
