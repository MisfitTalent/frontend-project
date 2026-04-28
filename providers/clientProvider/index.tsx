"use client";

import { useCallback, useContext, useEffect, useState } from "react";

import { useAuthState } from "@/providers/authProvider";
import {
  type BackendClientDto,
  type BackendPagedResult,
  backendRequest,
  buildCreateClientPayload,
  buildUpdateClientPayload,
  coerceItems,
  getSessionToken,
  isMockSessionToken,
  mapBackendClient,
} from "@/lib/client/backend-api";
import { initialClients } from "@/providers/domainSeeds";
import { ClientActionContext, ClientStateContext } from "./context";
import type { IClient } from "@/providers/salesTypes";

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

export default function ClientProvider({
  children,
}: ClientProviderProps) {
  const { isAuthenticated } = useAuthState();
  const [clients, setClients] = useState<IClient[]>([]);
  const isDemoMode = isMockSessionToken(getSessionToken());

  const loadClients = useCallback(async () => {
    const payload = await backendRequest<BackendPagedResult<BackendClientDto> | BackendClientDto[]>(
      "/api/Clients?pageNumber=1&pageSize=100",
    );

    setClients(coerceItems(payload).map(mapBackendClient));
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
            setClients(initialClients());
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
      });
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [isAuthenticated, isDemoMode, loadClients]);

  return (
    <ClientStateContext.Provider value={{ clients: isAuthenticated ? clients : [] }}>
      <ClientActionContext.Provider
        value={{
          addClient: async (payload) => {
            if (isDemoMode) {
              const response = await backendRequest<BackendClientDto>("/api/Clients", {
                body: JSON.stringify(buildCreateClientPayload(payload)),
                method: "POST",
              });
              const nextClient = mapBackendClient(response);

              setClients((current) => [...current, nextClient]);
              return nextClient;
            }

            const response = await backendRequest<BackendClientDto>("/api/Clients", {
              body: JSON.stringify(buildCreateClientPayload(payload)),
              method: "POST",
            });
            const nextClient = mapBackendClient(response);

            setClients((current) => [...current, nextClient]);

            return nextClient;
          },
          deleteClient: async (id) => {
            if (isDemoMode) {
              await backendRequest<void>(`/api/Clients/${id}`, {
                method: "DELETE",
              });
              setClients((current) => current.filter((item) => item.id !== id));
              return;
            }

            await backendRequest<void>(`/api/Clients/${id}`, {
              method: "DELETE",
            });

            setClients((current) => current.filter((item) => item.id !== id));
          },
          updateClient: async (id, payload) => {
            const existing = clients.find((item) => item.id === id);

            if (!existing) {
              return undefined;
            }

            const nextClient = { ...existing, ...payload };

            if (isDemoMode) {
              const response = await backendRequest<BackendClientDto>(`/api/Clients/${id}`, {
                body: JSON.stringify(buildUpdateClientPayload(nextClient)),
                method: "PUT",
              });
              const mappedClient = mapBackendClient(response);

              setClients((current) =>
                current.map((item) => (item.id === id ? mappedClient : item)),
              );

              return mappedClient;
            }

            const response = await backendRequest<BackendClientDto>(`/api/Clients/${id}`, {
              body: JSON.stringify(buildUpdateClientPayload(nextClient)),
              method: "PUT",
            });
            const mappedClient = mapBackendClient(response);

            setClients((current) =>
              current.map((item) => (item.id === id ? mappedClient : item)),
            );

            return mappedClient;
          },
        }}
      >
        {children}
      </ClientActionContext.Provider>
    </ClientStateContext.Provider>
  );
}
