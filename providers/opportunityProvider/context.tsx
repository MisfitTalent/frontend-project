import { createContext } from "react";

import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import type { IOpportunity } from "@/providers/salesTypes";

export interface IOpportunityStateContext {
  opportunities: IOpportunity[];
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
}

export interface IOpportunityActionContext {
  addOpportunity: (payload: IOpportunity) => Promise<IOpportunity>;
  deleteOpportunity: (id: string) => Promise<void>;
  updateOpportunity: (id: string, payload: Partial<IOpportunity>) => Promise<IOpportunity | undefined>;
}

export const INITIAL_STATE: IOpportunityStateContext = {
  opportunities: [],
  ...PROVIDER_REQUEST_IDLE,
};

export const OpportunityStateContext = createContext<
  IOpportunityStateContext | undefined
>(undefined);

export const OpportunityActionContext = createContext<
  IOpportunityActionContext | undefined
>(undefined);
