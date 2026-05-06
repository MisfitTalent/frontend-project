"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getPrimaryUserRole } from "@/lib/auth/roles";
import { useAuthState } from "@/providers/authProvider";
import {
  type BackendOpportunityDto,
  type BackendPagedResult,
  backendRequest,
  buildAssignOpportunityPayload,
  buildCreateOpportunityPayload,
  buildUpdateOpportunityPayload,
  buildUpdateOpportunityStagePayload,
  coerceItems,
  getSessionToken,
  isMockSessionToken,
  mapBackendOpportunity,
} from "@/lib/client/backend-api";
import { createProviderCacheKey, readProviderCache, writeProviderCache } from "@/lib/client/provider-cache";
import { initialOpportunities } from "@/providers/domainSeeds";
import { OpportunityActionContext, OpportunityStateContext } from "./context";
import { OpportunityStage, type IOpportunity } from "@/providers/salesTypes";

export const useOpportunityState = () => {
  const context = useContext(OpportunityStateContext);

  if (context === undefined) {
    throw new Error("useOpportunityState must be used within OpportunityProvider.");
  }

  return context;
};

export const useOpportunityActions = () => {
  const context = useContext(OpportunityActionContext);

  if (context === undefined) {
    throw new Error("useOpportunityActions must be used within OpportunityProvider.");
  }

  return context;
};

export default function OpportunityProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, user } = useAuthState();
  const isDemoMode = isMockSessionToken(getSessionToken());
  const role = getPrimaryUserRole(user?.roles);
  const cacheKey = useMemo(
    () => createProviderCacheKey("opportunities", user?.tenantId, user?.userId, role),
    [role, user?.tenantId, user?.userId],
  );
  const cachedOpportunities = useMemo(
    () => readProviderCache<IOpportunity[]>(cacheKey),
    [cacheKey],
  );
  const [opportunities, setOpportunities] = useState<IOpportunity[]>(
    () => cachedOpportunities ?? [],
  );

  const loadOpportunities = useCallback(async () => {
    const payload = await backendRequest<BackendPagedResult<BackendOpportunityDto> | BackendOpportunityDto[]>(
      role === "SalesRep"
        ? "/api/opportunities/my-opportunities?pageNumber=1&pageSize=100"
        : "/api/Opportunities?pageNumber=1&pageSize=100",
    );

    setOpportunities(
      writeProviderCache(cacheKey, coerceItems(payload).map(mapBackendOpportunity)),
    );
  }, [cacheKey, role]);

  useEffect(() => {
    writeProviderCache(cacheKey, opportunities);
  }, [cacheKey, opportunities]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isActive = true;

    if (isDemoMode) {
      const timer = window.setTimeout(() => {
        void loadOpportunities().catch((error) => {
          console.error(error);

          if (isActive) {
            setOpportunities(writeProviderCache(cacheKey, initialOpportunities()));
          }
        });
      }, 0);

      const handleWorkspaceUpdate = () => {
        void loadOpportunities().catch((error) => {
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

    if (cachedOpportunities && cachedOpportunities.length > 0) {
      return () => {
        isActive = false;
      };
    }

    void backendRequest<BackendPagedResult<BackendOpportunityDto> | BackendOpportunityDto[]>(
      role === "SalesRep"
        ? "/api/opportunities/my-opportunities?pageNumber=1&pageSize=100"
        : "/api/Opportunities?pageNumber=1&pageSize=100",
    )
      .then((payload) => {
        if (!isActive) {
          return;
        }

        setOpportunities(coerceItems(payload).map(mapBackendOpportunity));
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      isActive = false;
    };
  }, [cacheKey, cachedOpportunities, isAuthenticated, isDemoMode, loadOpportunities, role]);

  const assignIfNeeded = async (opportunity: IOpportunity, ownerId?: string) => {
    if (!ownerId) {
      return opportunity;
    }

    if (isDemoMode) {
      const response = await backendRequest<BackendOpportunityDto>(
        `/api/Opportunities/${opportunity.id}/assign`,
        {
          body: JSON.stringify(buildAssignOpportunityPayload(ownerId)),
          method: "POST",
        },
      );

      return mapBackendOpportunity(response);
    }

    const response = await backendRequest<BackendOpportunityDto>(
      `/api/Opportunities/${opportunity.id}/assign`,
      {
        body: JSON.stringify(buildAssignOpportunityPayload(ownerId)),
        method: "POST",
      },
    );

    return mapBackendOpportunity(response);
  };

  const moveStageIfNeeded = async (opportunity: IOpportunity, stage?: string) => {
    if (!stage || stage === OpportunityStage.New) {
      return opportunity;
    }

    if (isDemoMode) {
      const response = await backendRequest<BackendOpportunityDto>(
        `/api/Opportunities/${opportunity.id}/stage`,
        {
          body: JSON.stringify(buildUpdateOpportunityStagePayload(stage)),
          method: "PUT",
        },
      );

      return mapBackendOpportunity(response);
    }

    const response = await backendRequest<BackendOpportunityDto>(
      `/api/Opportunities/${opportunity.id}/stage`,
      {
        body: JSON.stringify(buildUpdateOpportunityStagePayload(stage)),
        method: "PUT",
      },
    );

    return mapBackendOpportunity(response);
  };

  return (
    <OpportunityStateContext.Provider
      value={{ opportunities: isAuthenticated ? opportunities : [] }}
    >
      <OpportunityActionContext.Provider
        value={{
          addOpportunity: async (payload) => {
            if (isDemoMode) {
              const nextOpportunity = mapBackendOpportunity(
                await backendRequest<BackendOpportunityDto>("/api/Opportunities", {
                  body: JSON.stringify(buildCreateOpportunityPayload(payload)),
                  method: "POST",
                }),
              );

              setOpportunities((current) => [...current, nextOpportunity]);

              return nextOpportunity;
            }

            let nextOpportunity = mapBackendOpportunity(
              await backendRequest<BackendOpportunityDto>("/api/Opportunities", {
                body: JSON.stringify(buildCreateOpportunityPayload(payload)),
                method: "POST",
              }),
            );

            nextOpportunity = await assignIfNeeded(nextOpportunity, payload.ownerId);
            nextOpportunity = await moveStageIfNeeded(nextOpportunity, String(payload.stage));

            setOpportunities((current) => [...current, nextOpportunity]);

            return nextOpportunity;
          },
          deleteOpportunity: async (id) => {
            if (isDemoMode) {
              await backendRequest<void>(`/api/Opportunities/${id}`, {
                method: "DELETE",
              });
              setOpportunities((current) => current.filter((item) => item.id !== id));
              return;
            }

            await backendRequest<void>(`/api/Opportunities/${id}`, {
              method: "DELETE",
            });

            setOpportunities((current) => current.filter((item) => item.id !== id));
          },
          updateOpportunity: async (id, payload) => {
            const existing = opportunities.find((item) => item.id === id);

            if (!existing) {
              return undefined;
            }

            const merged = { ...existing, ...payload };

            if (isDemoMode) {
              let nextOpportunity = mapBackendOpportunity(
                await backendRequest<BackendOpportunityDto>(`/api/Opportunities/${id}`, {
                  body: JSON.stringify(buildUpdateOpportunityPayload(merged)),
                  method: "PUT",
                }),
              );

              if (payload.ownerId && payload.ownerId !== existing.ownerId) {
                nextOpportunity = await assignIfNeeded(nextOpportunity, payload.ownerId);
              }

              if (payload.stage && payload.stage !== existing.stage) {
                nextOpportunity = await moveStageIfNeeded(nextOpportunity, String(payload.stage));
              }

              setOpportunities((current) =>
                current.map((item) => (item.id === id ? nextOpportunity : item)),
              );

              return nextOpportunity;
            }

            let nextOpportunity = mapBackendOpportunity(
              await backendRequest<BackendOpportunityDto>(`/api/Opportunities/${id}`, {
                body: JSON.stringify(buildUpdateOpportunityPayload(merged)),
                method: "PUT",
              }),
            );

            if (payload.ownerId && payload.ownerId !== existing.ownerId) {
              nextOpportunity = await assignIfNeeded(nextOpportunity, payload.ownerId);
            }

            if (payload.stage && payload.stage !== existing.stage) {
              nextOpportunity = await moveStageIfNeeded(nextOpportunity, String(payload.stage));
            }

            setOpportunities((current) =>
              current.map((item) => (item.id === id ? nextOpportunity : item)),
            );

            return nextOpportunity;
          },
        }}
      >
        {children}
      </OpportunityActionContext.Provider>
    </OpportunityStateContext.Provider>
  );
}
