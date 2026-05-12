"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  type BackendActivityDto,
  type BackendPagedResult,
  backendRequest,
  buildCompleteActivityPayload,
  buildCreateActivityPayload,
  buildUpdateActivityPayload,
  coerceItems,
  getSessionToken,
  isMockSessionToken,
  mapBackendActivity,
} from "@/lib/client/backend-api";
import { createProviderCacheKey, readProviderCache, writeProviderCache } from "@/lib/client/provider-cache";
import { getPrimaryUserRole } from "@/lib/auth/roles";
import { useAuthState } from "@/providers/authProvider";
import { initialActivities } from "@/providers/domainSeeds";
import { ActivityStatus, type IActivity } from "@/providers/salesTypes";
import { ActivityActionContext, ActivityStateContext } from "./context";

export const useActivityState = () => {
  const context = useContext(ActivityStateContext);

  if (context === undefined) {
    throw new Error("useActivityState must be used within ActivityProvider.");
  }

  return context;
};

export const useActivityActions = () => {
  const context = useContext(ActivityActionContext);

  if (context === undefined) {
    throw new Error("useActivityActions must be used within ActivityProvider.");
  }

  return context;
};

type ActivityProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export default function ActivityProvider({
  children,
}: ActivityProviderProps) {
  const { isAuthenticated, user } = useAuthState();
  const isDemoMode = isMockSessionToken(getSessionToken());
  const role = getPrimaryUserRole(user?.roles);
  const cacheKey = useMemo(
    () => createProviderCacheKey("activities", user?.tenantId, user?.userId, role),
    [role, user?.tenantId, user?.userId],
  );
  const cachedActivities = useMemo(
    () => readProviderCache<IActivity[]>(cacheKey),
    [cacheKey],
  );
  const [activities, setActivities] = useState<IActivity[]>(
    () => cachedActivities ?? [],
  );

  const listPath =
    role === "SalesRep"
      ? "/api/activities/my-activities?pageNumber=1&pageSize=100"
      : "/api/Activities?pageNumber=1&pageSize=100";

  const loadActivities = useCallback(async () => {
    const payload = await backendRequest<BackendPagedResult<BackendActivityDto> | BackendActivityDto[]>(
      listPath,
    );

    setActivities(writeProviderCache(cacheKey, coerceItems(payload).map(mapBackendActivity)));
  }, [cacheKey, listPath]);

  useEffect(() => {
    writeProviderCache(cacheKey, activities);
  }, [cacheKey, activities]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isActive = true;

    if (isDemoMode) {
      const timer = window.setTimeout(() => {
        void loadActivities().catch((error) => {
          console.error(error);

          if (isActive) {
            setActivities(writeProviderCache(cacheKey, initialActivities()));
          }
        });
      }, 0);

      const handleWorkspaceUpdate = () => {
        void loadActivities().catch((error) => {
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

    if (cachedActivities && cachedActivities.length > 0) {
      return () => {
        isActive = false;
      };
    }

    void backendRequest<BackendPagedResult<BackendActivityDto> | BackendActivityDto[]>(listPath)
      .then((payload) => {
        if (!isActive) {
          return;
        }

        setActivities(coerceItems(payload).map(mapBackendActivity));
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      isActive = false;
    };
  }, [cacheKey, cachedActivities, isAuthenticated, isDemoMode, listPath, loadActivities, role]);

  return (
    <ActivityStateContext.Provider value={{ activities: isAuthenticated ? activities : [] }}>
      <ActivityActionContext.Provider
        value={{
          addActivity: async (payload) => {
            if (isDemoMode) {
              setActivities((current) => [...current, payload]);
              return payload;
            }

            const nextActivity = mapBackendActivity(
              await backendRequest<BackendActivityDto>("/api/Activities", {
                body: JSON.stringify(buildCreateActivityPayload(payload)),
                method: "POST",
              }),
            );

            setActivities((current) => [...current, nextActivity]);

            return nextActivity;
          },
          deleteActivity: async (id) => {
            if (isDemoMode) {
              setActivities((current) => current.filter((item) => item.id !== id));
              return;
            }

            await backendRequest<void>(`/api/Activities/${id}`, {
              method: "DELETE",
            });

            setActivities((current) => current.filter((item) => item.id !== id));
          },
          updateActivity: async (id, payload) => {
            const existing = activities.find((item) => item.id === id);

            if (!existing) {
              return undefined;
            }

            const nextActivity = { ...existing, ...payload };

            if (isDemoMode) {
              setActivities((current) =>
                current.map((item) => (item.id === id ? nextActivity : item)),
              );
              return nextActivity;
            }

            let mappedActivity: IActivity;

            if (!existing.completed && nextActivity.completed) {
              mappedActivity = mapBackendActivity(
                await backendRequest<BackendActivityDto>(`/api/Activities/${id}/complete`, {
                  body: JSON.stringify(buildCompleteActivityPayload(nextActivity)),
                  method: "PUT",
                }),
              );
            } else if (nextActivity.status === ActivityStatus.Cancelled) {
              mappedActivity = mapBackendActivity(
                await backendRequest<BackendActivityDto>(`/api/Activities/${id}/cancel`, {
                  method: "PUT",
                }),
              );
            } else {
              mappedActivity = mapBackendActivity(
                await backendRequest<BackendActivityDto>(`/api/Activities/${id}`, {
                  body: JSON.stringify(buildUpdateActivityPayload(nextActivity)),
                  method: "PUT",
                }),
              );
            }

            setActivities((current) =>
              current.map((item) => (item.id === id ? mappedActivity : item)),
            );

            return mappedActivity;
          },
        }}
      >
        {children}
      </ActivityActionContext.Provider>
    </ActivityStateContext.Provider>
  );
}
