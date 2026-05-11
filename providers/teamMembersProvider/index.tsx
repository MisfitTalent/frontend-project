"use client";

import { useCallback, useContext, useEffect, useMemo, useReducer } from "react";

import { getPrimaryUserRole } from "@/lib/auth/roles";
import {
  type BackendPagedResult,
  type BackendUserDto,
  backendRequest,
  coerceItems,
  getSessionToken,
  isMockSessionToken,
  mapBackendUser,
} from "@/lib/client/backend-api";
import { createProviderCacheKey, writeProviderCache, readProviderCache } from "@/lib/client/provider-cache";
import { useAuthState } from "@/providers/authProvider";
import { initialTeamMembers } from "@/providers/domainSeeds";
import type { ITeamMember } from "@/providers/salesTypes";
import { syncTeamMembersAction } from "./actions";
import {
  INITIAL_STATE,
  TeamMembersActionContext,
  TeamMembersStateContext,
} from "./context";
import { TeamMembersReducer } from "./reducers";

export const useTeamMembersState = () => {
  const context = useContext(TeamMembersStateContext);

  if (context === undefined) {
    throw new Error("useTeamMembersState must be used within TeamMembersProvider.");
  }

  return context;
};

export const useTeamMembersActions = () => {
  const context = useContext(TeamMembersActionContext);

  if (context === undefined) {
    throw new Error("useTeamMembersActions must be used within TeamMembersProvider.");
  }

  return context;
};

const createInitialState = (teamMembers: ITeamMember[]) => ({
  ...INITIAL_STATE,
  teamMembers,
});

export default function TeamMembersProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const fallbackTeamMembers = useMemo(() => initialTeamMembers(), []);
  const { isAuthenticated, user } = useAuthState();
  const isDemoMode = isMockSessionToken(getSessionToken());
  const role = getPrimaryUserRole(user?.roles);
  const cacheKey = useMemo(
    () => createProviderCacheKey("team-members", user?.tenantId, user?.userId, role),
    [role, user?.tenantId, user?.userId],
  );
  const cachedTeamMembers = useMemo(
    () => readProviderCache<ITeamMember[]>(cacheKey),
    [cacheKey],
  );
  const [state, dispatch] = useReducer(
    TeamMembersReducer,
    cachedTeamMembers ?? fallbackTeamMembers,
    createInitialState,
  );
  const listPath = `/api/Users?pageNumber=1&pageSize=100&isActive=true${
    role === "SalesRep" ? "&role=SalesRep" : ""
  }`;

  const loadTeamMembers = useCallback(async () => {
    const payload = await backendRequest<BackendPagedResult<BackendUserDto> | BackendUserDto[]>(
      listPath,
    );
    const users = coerceItems(payload).map(mapBackendUser);

    dispatch(
      syncTeamMembersAction(
        writeProviderCache(
          cacheKey,
          users.length > 0 ? users : fallbackTeamMembers,
        ),
      ),
    );
  }, [cacheKey, fallbackTeamMembers, listPath]);

  useEffect(() => {
    writeProviderCache(cacheKey, state.teamMembers);
  }, [cacheKey, state.teamMembers]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isActive = true;

    const runLoad = () => {
      void loadTeamMembers().catch((error) => {
        console.error(error);

        if (isActive) {
          dispatch(
            syncTeamMembersAction(writeProviderCache(cacheKey, fallbackTeamMembers)),
          );
        }
      });
    };

    const timer = window.setTimeout(runLoad, 0);

    if (isDemoMode) {
      const handleWorkspaceUpdate = () => {
        runLoad();
      };

      window.addEventListener("mock-workspace-updated", handleWorkspaceUpdate);

      return () => {
        isActive = false;
        window.clearTimeout(timer);
        window.removeEventListener("mock-workspace-updated", handleWorkspaceUpdate);
      };
    }

    if (cachedTeamMembers && cachedTeamMembers.length > 0) {
      return () => {
        isActive = false;
        window.clearTimeout(timer);
      };
    }

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [cacheKey, cachedTeamMembers, fallbackTeamMembers, isAuthenticated, isDemoMode, loadTeamMembers]);

  return (
    <TeamMembersStateContext.Provider
      value={{
        teamMembers: isAuthenticated ? state.teamMembers : fallbackTeamMembers,
      }}
    >
      <TeamMembersActionContext.Provider
        value={{
          syncTeamMembers: (payload) => dispatch(syncTeamMembersAction(payload)),
        }}
      >
        {children}
      </TeamMembersActionContext.Provider>
    </TeamMembersStateContext.Provider>
  );
}
