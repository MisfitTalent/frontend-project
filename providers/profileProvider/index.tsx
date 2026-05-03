"use client";

import { useContext, useEffect, useReducer } from "react";

import { getPrimaryUserRole } from "@/lib/auth/roles";
import { useAuthState } from "@/providers/authProvider";
import { PROVIDER_REQUEST_SUCCESS } from "@/providers/provider-state";
import { syncProfileAction } from "./actions";
import { ProfileActionContext, ProfileStateContext, INITIAL_STATE } from "./context";
import { ProfileReducer } from "./reducers";

export const useProfileState = () => {
  const context = useContext(ProfileStateContext);

  if (context === undefined) {
    throw new Error("useProfileState must be used within ProfileProvider.");
  }

  return context;
};

export const useProfileActions = () => {
  const context = useContext(ProfileActionContext);

  if (context === undefined) {
    throw new Error("useProfileActions must be used within ProfileProvider.");
  }

  return context;
};

export const ProfileProvider = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const { user } = useAuthState();
  const initialProfileState = {
    email: user?.email ?? INITIAL_STATE.email,
    firstName: user?.firstName ?? INITIAL_STATE.firstName,
    ...PROVIDER_REQUEST_SUCCESS,
    lastName: user?.lastName ?? INITIAL_STATE.lastName,
    role: getPrimaryUserRole(user?.roles),
    workspace: user?.tenantName ?? INITIAL_STATE.workspace,
  };
  const [state, dispatch] = useReducer(ProfileReducer, initialProfileState);

  useEffect(() => {
    dispatch(
      syncProfileAction({
        email: user?.email ?? "Unknown",
        firstName: user?.firstName ?? "Unknown",
        lastName: user?.lastName ?? "Unknown",
        role: getPrimaryUserRole(user?.roles),
        workspace: user?.tenantName ?? "AutoSales Workspace",
      }),
    );
  }, [user]);

  return (
    <ProfileStateContext.Provider value={state}>
      <ProfileActionContext.Provider
        value={{
          syncProfile: (payload) => dispatch(syncProfileAction(payload)),
        }}
      >
        {children}
      </ProfileActionContext.Provider>
    </ProfileStateContext.Provider>
  );
};
