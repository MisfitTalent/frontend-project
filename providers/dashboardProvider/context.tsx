import { createContext } from "react";

import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import type {
  IAutomationEvent,
  IClientBundleInput,
  ISalesData,
  ITeamMember,
} from "@/providers/salesTypes";

export interface IDashboardStateContext {
  automationFeed: IAutomationEvent[];
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
  salesData: ISalesData;
  teamMembers: ITeamMember[];
}

export interface IDashboardActionContext {
  addAutomationEvent: (payload: IAutomationEvent) => void;
  addClientBundle: (payload: IClientBundleInput) => void;
}

export const INITIAL_STATE: IDashboardStateContext = {
  automationFeed: [],
  ...PROVIDER_REQUEST_IDLE,
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
