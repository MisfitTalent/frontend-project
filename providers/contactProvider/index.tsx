"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { useAuthState } from "@/providers/authProvider";
import {
  type BackendContactDto,
  type BackendPagedResult,
  backendRequest,
  buildCreateContactPayload,
  buildUpdateContactPayload,
  coerceItems,
  getSessionToken,
  isMockSessionToken,
  mapBackendContact,
} from "@/lib/client/backend-api";
import { createProviderCacheKey, readProviderCache, writeProviderCache } from "@/lib/client/provider-cache";
import { initialContacts } from "@/providers/domainSeeds";
import { ContactActionContext, ContactStateContext } from "./context";
import type { IContact } from "@/providers/salesTypes";

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

export default function ContactProvider({
  children,
}: ContactProviderProps) {
  const { isAuthenticated, user } = useAuthState();
  const isDemoMode = isMockSessionToken(getSessionToken());
  const scopedClientIds = useMemo(() => new Set(user?.clientIds ?? []), [user?.clientIds]);
  const isScopedClient = isClientScopedUser(user?.clientIds);
  const cacheKey = useMemo(
    () => createProviderCacheKey("contacts", user?.tenantId, user?.userId),
    [user?.tenantId, user?.userId],
  );
  const cachedContacts = useMemo(() => readProviderCache<IContact[]>(cacheKey), [cacheKey]);
  const [contacts, setContacts] = useState<IContact[]>(
    () => cachedContacts ?? [],
  );

  const scopeContacts = useCallback(
    (items: IContact[]) =>
      isScopedClient
        ? items.filter((contact) => scopedClientIds.has(contact.clientId))
        : items,
    [isScopedClient, scopedClientIds],
  );

  const loadContacts = useCallback(async () => {
    const payload = await backendRequest<BackendPagedResult<BackendContactDto> | BackendContactDto[]>(
      "/api/Contacts?pageNumber=1&pageSize=100",
    );

    setContacts(
      writeProviderCache(cacheKey, scopeContacts(coerceItems(payload).map(mapBackendContact))),
    );
  }, [cacheKey, scopeContacts]);

  useEffect(() => {
    writeProviderCache(cacheKey, contacts);
  }, [cacheKey, contacts]);

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
            setContacts(writeProviderCache(cacheKey, scopeContacts(initialContacts())));
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

    if (cachedContacts && cachedContacts.length > 0) {
      return () => {
        isActive = false;
      };
    }

    const timer = window.setTimeout(() => {
      void loadContacts().catch((error) => {
        console.error(error);
      });
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [cacheKey, cachedContacts, isAuthenticated, isDemoMode, loadContacts, scopeContacts]);

  return (
    <ContactStateContext.Provider value={{ contacts: isAuthenticated ? contacts : [] }}>
      <ContactActionContext.Provider
        value={{
          addContact: async (payload) => {
            if (isDemoMode) {
              const response = await backendRequest<BackendContactDto>("/api/Contacts", {
                body: JSON.stringify(buildCreateContactPayload(payload)),
                method: "POST",
              });
              const nextContact = mapBackendContact(response);

              setContacts((current) => [...current, nextContact]);
              return nextContact;
            }

            const response = await backendRequest<BackendContactDto>("/api/Contacts", {
              body: JSON.stringify(buildCreateContactPayload(payload)),
              method: "POST",
            });
            const nextContact = mapBackendContact(response);

            setContacts((current) => [...current, nextContact]);

            return nextContact;
          },
          deleteContact: async (id) => {
            if (isDemoMode) {
              await backendRequest<void>(`/api/Contacts/${id}`, {
                method: "DELETE",
              });
              setContacts((current) => current.filter((item) => item.id !== id));
              return;
            }

            await backendRequest<void>(`/api/Contacts/${id}`, {
              method: "DELETE",
            });

            setContacts((current) => current.filter((item) => item.id !== id));
          },
          updateContact: async (id, payload) => {
            const existing = contacts.find((item) => item.id === id);

            if (!existing) {
              return undefined;
            }

            const nextContact = { ...existing, ...payload };

            if (isDemoMode) {
              const response = await backendRequest<BackendContactDto>(`/api/Contacts/${id}`, {
                body: JSON.stringify(buildUpdateContactPayload(nextContact)),
                method: "PUT",
              });
              const mappedContact = mapBackendContact(response);

              setContacts((current) =>
                current.map((item) => (item.id === id ? mappedContact : item)),
              );

              return mappedContact;
            }

            const response = await backendRequest<BackendContactDto>(`/api/Contacts/${id}`, {
              body: JSON.stringify(buildUpdateContactPayload(nextContact)),
              method: "PUT",
            });
            const mappedContact = mapBackendContact(response);

            setContacts((current) =>
              current.map((item) => (item.id === id ? mappedContact : item)),
            );

            return mappedContact;
          },
        }}
      >
        {children}
      </ContactActionContext.Provider>
    </ContactStateContext.Provider>
  );
}
