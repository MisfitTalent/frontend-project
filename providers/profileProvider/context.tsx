import { createContext } from "react";

import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";

export interface IProfileSnapshot {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  workspace: string;
}

export interface IProfileStateContext extends IProfileSnapshot {
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
}

export interface IProfileActionContext {
  syncProfile: (payload: IProfileSnapshot) => void;
}

export const INITIAL_STATE: IProfileStateContext = {
  email: "Unknown",
  firstName: "Unknown",
  ...PROVIDER_REQUEST_IDLE,
  lastName: "Unknown",
  role: "SalesRep",
  workspace: "AutoSales Workspace",
};

export const ProfileStateContext = createContext<IProfileStateContext | undefined>(
  undefined,
);

export const ProfileActionContext = createContext<IProfileActionContext | undefined>(
  undefined,
);
