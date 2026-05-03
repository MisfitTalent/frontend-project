"use client";
import { useCallback, useContext, useEffect, useReducer } from "react";
import { useAuthState } from "@/providers/authProvider";
import { type BackendClientDto, type BackendPagedResult, backendRequest, buildCreateClientPayload, buildUpdateClientPayload, coerceItems, mapBackendClient, } from "@/lib/client/backend-api";
import { initialClients } from "@/providers/domainSeeds";
import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import { addClientAction, clientErrorAction, clientPendingAction, deleteClientAction, setClientsAction, updateClientAction, } from "./actions";
import { ClientActionContext, ClientStateContext, INITIAL_STATE } from "./context";
import { ClientReducer } from "./reducers";
export const useClientState = () => {
    const context = useContext(ClientStateContext);
    if (context === undefined) {
        throw new Error("useClientState must be used within ClientProvider.");
    }
    return context;
};
export const useClientActions = () => {
    const context = useContext(ClientActionContext);
    if (context === undefined) {
        throw new Error("useClientActions must be used within ClientProvider.");
    }
    return context;
};
type ClientProviderProps = Readonly<{
    children: React.ReactNode;
}>;
export const ClientProvider = ({ children, }: ClientProviderProps) => {
    const { isAuthenticated, user } = useAuthState();
    const [state, dispatch] = useReducer(ClientReducer, INITIAL_STATE);
    const isDemoMode = Boolean(user?.isMockSession);
    const loadClients = useCallback(async () => {
        dispatch(clientPendingAction());
        const payload = await backendRequest<BackendPagedResult<BackendClientDto> | BackendClientDto[]>("/api/Clients?pageNumber=1&pageSize=100");
        dispatch(setClientsAction(coerceItems(payload).map(mapBackendClient)));
    }, []);
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }
        let isActive = true;
        if (isDemoMode) {
            const timer = window.setTimeout(() => {
                void loadClients().catch((error) => {
                    console.error(error);
                    if (isActive) {
                        dispatch(setClientsAction(initialClients()));
                    }
                });
            }, 0);
            const handleWorkspaceUpdate = () => {
                void loadClients().catch((error) => {
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
            void loadClients().catch((error) => {
                console.error(error);
                if (isActive) {
                    dispatch(clientErrorAction());
                }
            });
        }, 0);
        return () => {
            isActive = false;
            window.clearTimeout(timer);
        };
    }, [dispatch, isAuthenticated, isDemoMode, loadClients]);
    return (<ClientStateContext.Provider value={{
            ...(isAuthenticated ? state : { ...state, ...PROVIDER_REQUEST_IDLE }),
            clients: isAuthenticated ? state.clients : [],
        }}>
      <ClientActionContext.Provider value={{
            addClient: async (payload) => {
                dispatch(clientPendingAction());
                try {
                    const response = await backendRequest<BackendClientDto>("/api/Clients", {
                        body: JSON.stringify(buildCreateClientPayload(payload)),
                        method: "POST",
                    });
                    const nextClient = mapBackendClient(response);
                    dispatch(addClientAction(nextClient));
                    return nextClient;
                }
                catch (error) {
                    dispatch(clientErrorAction());
                    throw error;
                }
            },
            deleteClient: async (id) => {
                dispatch(clientPendingAction());
                try {
                    await backendRequest<void>(`/api/Clients/${id}`, {
                        method: "DELETE",
                    });
                    dispatch(deleteClientAction(id));
                }
                catch (error) {
                    dispatch(clientErrorAction());
                    throw error;
                }
            },
            updateClient: async (id, payload) => {
                const existing = state.clients.find((item) => item.id === id);
                if (!existing) {
                    return undefined;
                }
                const nextClient = { ...existing, ...payload };
                dispatch(clientPendingAction());
                try {
                    const response = await backendRequest<BackendClientDto>(`/api/Clients/${id}`, {
                        body: JSON.stringify(buildUpdateClientPayload(nextClient)),
                        method: "PUT",
                    });
                    const mappedClient = mapBackendClient(response);
                    dispatch(updateClientAction(mappedClient));
                    return mappedClient;
                }
                catch (error) {
                    dispatch(clientErrorAction());
                    throw error;
                }
            },
        }}>
        {children}
      </ClientActionContext.Provider>
    </ClientStateContext.Provider>);
};
