import { createContext } from "react";

import type { IOpportunity } from "@/providers/salesTypes";

export interface IOpportunityStateContext {
  opportunities: IOpportunity[];
}

export interface IOpportunityActionContext {
  addOpportunity: (payload: IOpportunity) => Promise<IOpportunity>;
  deleteOpportunity: (id: string) => Promise<void>;
  updateOpportunity: (id: string, payload: Partial<IOpportunity>) => Promise<IOpportunity | undefined>;
}

export const INITIAL_STATE: IOpportunityStateContext = {
  opportunities: [],
};

export const OpportunityStateContext = createContext<
  IOpportunityStateContext | undefined
>(undefined);

export const OpportunityActionContext = createContext<
  IOpportunityActionContext | undefined
>(undefined);
