"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getPrimaryUserRole } from "@/lib/auth/roles";
import {
  type BackendPagedResult,
  type BackendPricingRequestDto,
  backendRequest,
  buildAssignPricingRequestPayload,
  buildCreatePricingRequestPayload,
  buildUpdatePricingRequestPayload,
  coerceItems,
  getSessionToken,
  isMockSessionToken,
  mapBackendPricingRequest,
} from "@/lib/client/backend-api";
import { createProviderCacheKey, readProviderCache, writeProviderCache } from "@/lib/client/provider-cache";
import { useAuthState } from "@/providers/authProvider";
import { initialPricingRequests } from "@/providers/domainSeeds";
import type { IPricingRequest } from "@/providers/salesTypes";
import {
  PricingRequestActionContext,
  PricingRequestStateContext,
} from "./context";

export const usePricingRequestState = () => {
  const context = useContext(PricingRequestStateContext);

  if (context === undefined) {
    throw new Error("usePricingRequestState must be used within PricingRequestProvider.");
  }

  return context;
};

export const usePricingRequestActions = () => {
  const context = useContext(PricingRequestActionContext);

  if (context === undefined) {
    throw new Error(
      "usePricingRequestActions must be used within PricingRequestProvider.",
    );
  }

  return context;
};

export default function PricingRequestProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, user } = useAuthState();
  const isDemoMode = isMockSessionToken(getSessionToken());
  const role = getPrimaryUserRole(user?.roles);
  const cacheKey = useMemo(
    () => createProviderCacheKey("pricing-requests", user?.tenantId, user?.userId, role),
    [role, user?.tenantId, user?.userId],
  );
  const [pricingRequests, setPricingRequests] = useState<IPricingRequest[]>(
    () => readProviderCache<IPricingRequest[]>(cacheKey) ?? [],
  );

  const listPath =
    role === "SalesRep"
      ? "/api/pricingrequests/my-requests?pageNumber=1&pageSize=100"
      : "/api/PricingRequests?pageNumber=1&pageSize=100";

  const loadPricingRequests = useCallback(async () => {
    const payload = await backendRequest<BackendPagedResult<BackendPricingRequestDto> | BackendPricingRequestDto[]>(
      listPath,
    );

    setPricingRequests(
      writeProviderCache(cacheKey, coerceItems(payload).map(mapBackendPricingRequest)),
    );
  }, [cacheKey, listPath]);

  useEffect(() => {
    writeProviderCache(cacheKey, pricingRequests);
  }, [cacheKey, pricingRequests]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isActive = true;

    if (isDemoMode) {
      const timer = window.setTimeout(() => {
        void loadPricingRequests().catch((error) => {
          console.error(error);

          if (isActive) {
            setPricingRequests(writeProviderCache(cacheKey, initialPricingRequests()));
          }
        });
      }, 0);

      const handleWorkspaceUpdate = () => {
        void loadPricingRequests().catch((error) => {
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
      void loadPricingRequests().catch((error) => {
        console.error(error);
      });
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [cacheKey, isAuthenticated, isDemoMode, loadPricingRequests]);

  const replacePricingRequest = (request: IPricingRequest) => {
    setPricingRequests((current) => {
      const exists = current.some((item) => item.id === request.id);

      return exists
        ? current.map((item) => (item.id === request.id ? request : item))
        : [...current, request];
    });
  };

  return (
    <PricingRequestStateContext.Provider
      value={{ pricingRequests: isAuthenticated ? pricingRequests : [] }}
    >
      <PricingRequestActionContext.Provider
        value={{
          addPricingRequest: async (payload) => {
            if (isDemoMode) {
              replacePricingRequest(payload);
              return payload;
            }

            const request = mapBackendPricingRequest(
              await backendRequest<BackendPricingRequestDto>("/api/PricingRequests", {
                body: JSON.stringify(buildCreatePricingRequestPayload(payload)),
                method: "POST",
              }),
            );

            replacePricingRequest(request);

            return request;
          },
          assignPricingRequest: async (id, userId) => {
            const existing = pricingRequests.find((item) => item.id === id);

            if (!existing) {
              return undefined;
            }

            if (isDemoMode) {
              const request = {
                ...existing,
                assignedToId: userId,
              };

              replacePricingRequest(request);

              return request;
            }

            const request = mapBackendPricingRequest(
              await backendRequest<BackendPricingRequestDto>(
                `/api/PricingRequests/${id}/assign`,
                {
                  body: JSON.stringify(buildAssignPricingRequestPayload(userId)),
                  method: "POST",
                },
              ),
            );

            replacePricingRequest(request);

            return request;
          },
          completePricingRequest: async (id) => {
            const existing = pricingRequests.find((item) => item.id === id);

            if (!existing) {
              return undefined;
            }

            if (isDemoMode) {
              const request = {
                ...existing,
                completedDate: new Date().toISOString().split("T")[0],
                status: "Completed",
              };

              replacePricingRequest(request);

              return request;
            }

            const request = mapBackendPricingRequest(
              await backendRequest<BackendPricingRequestDto>(
                `/api/PricingRequests/${id}/complete`,
                {
                  method: "PUT",
                },
              ),
            );

            replacePricingRequest(request);

            return request;
          },
          deletePricingRequest: async (id) => {
            if (isDemoMode) {
              setPricingRequests((current) => current.filter((item) => item.id !== id));
              return;
            }

            await backendRequest<void>(`/api/PricingRequests/${id}`, {
              method: "DELETE",
            });

            setPricingRequests((current) => current.filter((item) => item.id !== id));
          },
          updatePricingRequest: async (id, payload) => {
            const existing = pricingRequests.find((item) => item.id === id);

            if (!existing) {
              return undefined;
            }

            const nextRequest = { ...existing, ...payload };

            if (isDemoMode) {
              replacePricingRequest(nextRequest);
              return nextRequest;
            }

            let mappedRequest = mapBackendPricingRequest(
              await backendRequest<BackendPricingRequestDto>(`/api/PricingRequests/${id}`, {
                body: JSON.stringify(buildUpdatePricingRequestPayload(nextRequest)),
                method: "PUT",
              }),
            );

            if (payload.assignedToId && payload.assignedToId !== existing.assignedToId) {
              mappedRequest = mapBackendPricingRequest(
                await backendRequest<BackendPricingRequestDto>(
                  `/api/PricingRequests/${id}/assign`,
                  {
                    body: JSON.stringify(
                      buildAssignPricingRequestPayload(payload.assignedToId),
                    ),
                    method: "POST",
                  },
                ),
              );
            }

            replacePricingRequest(mappedRequest);

            return mappedRequest;
          },
        }}
      >
        {children}
      </PricingRequestActionContext.Provider>
    </PricingRequestStateContext.Provider>
  );
}
