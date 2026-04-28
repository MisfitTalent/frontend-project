import { createContext } from "react";

export interface IProfileStateContext {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  workspace: string;
}

export interface IProfileActionContext {
  syncProfile: (payload: IProfileStateContext) => void;
}

export const INITIAL_STATE: IProfileStateContext = {
  email: "Unknown",
  firstName: "Unknown",
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
