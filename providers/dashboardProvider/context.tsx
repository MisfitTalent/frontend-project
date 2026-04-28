import { createContext } from "react";

import type {
  IAutomationEvent,
  IClientBundleInput,
  ISalesData,
  ITeamMember,
} from "@/providers/salesTypes";

export interface IDashboardStateContext {
  automationFeed: IAutomationEvent[];
  salesData: ISalesData;
  teamMembers: ITeamMember[];
}

export interface IDashboardActionContext {
  addAutomationEvent: (payload: IAutomationEvent) => void;
  addClientBundle: (payload: IClientBundleInput) => void;
}

export const INITIAL_STATE: IDashboardStateContext = {
  automationFeed: [],
  salesData: {
    activities: [],
    automationFeed: [],
    clients: [],
    contacts: [],
    contracts: [],
    opportunities: [],
    proposals: [],
    renewals: [],
    teamMembers: [],
  },
  teamMembers: [],
};

export const DashboardStateContext = createContext<IDashboardStateContext | undefined>(
  undefined,
);

export const DashboardActionContext = createContext<IDashboardActionContext | undefined>(
  undefined,
);
