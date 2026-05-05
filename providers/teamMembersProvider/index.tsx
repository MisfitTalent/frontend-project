"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

interface ITeamMembersStateContext {
  teamMembers: ITeamMember[];
}

const TeamMembersStateContext = createContext<ITeamMembersStateContext | undefined>(undefined);

export const useTeamMembersState = () => {
  const context = useContext(TeamMembersStateContext);

  if (context === undefined) {
    throw new Error("useTeamMembersState must be used within TeamMembersProvider.");
  }

  return context;
};

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
  const [teamMembers, setTeamMembers] = useState<ITeamMember[]>(
    () => readProviderCache<ITeamMember[]>(cacheKey) ?? fallbackTeamMembers,
  );
  const listPath = `/api/Users?pageNumber=1&pageSize=100&isActive=true${
    role === "SalesRep" ? "&role=SalesRep" : ""
  }`;

  const loadTeamMembers = useCallback(async () => {
    const payload = await backendRequest<BackendPagedResult<BackendUserDto> | BackendUserDto[]>(
      listPath,
    );
    const users = coerceItems(payload).map(mapBackendUser);

    setTeamMembers(
      writeProviderCache(
        cacheKey,
        users.length > 0 ? users : fallbackTeamMembers,
      ),
    );
  }, [cacheKey, fallbackTeamMembers, listPath]);

  useEffect(() => {
    writeProviderCache(cacheKey, teamMembers);
  }, [cacheKey, teamMembers]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isActive = true;

    const runLoad = () => {
      void loadTeamMembers().catch((error) => {
        console.error(error);

        if (isActive) {
          setTeamMembers(writeProviderCache(cacheKey, fallbackTeamMembers));
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

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [cacheKey, fallbackTeamMembers, isAuthenticated, isDemoMode, loadTeamMembers]);

  return (
    <TeamMembersStateContext.Provider
      value={{ teamMembers: isAuthenticated ? teamMembers : fallbackTeamMembers }}
    >
      {children}
    </TeamMembersStateContext.Provider>
  );
}
