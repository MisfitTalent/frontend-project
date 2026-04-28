import { createContext } from "react";

import type { IPricingRequest } from "@/providers/salesTypes";

export interface IPricingRequestStateContext {
  pricingRequests: IPricingRequest[];
}

export interface IPricingRequestActionContext {
  addPricingRequest: (payload: IPricingRequest) => Promise<IPricingRequest>;
  assignPricingRequest: (id: string, userId: string) => Promise<IPricingRequest | undefined>;
  completePricingRequest: (id: string) => Promise<IPricingRequest | undefined>;
  deletePricingRequest: (id: string) => Promise<void>;
  updatePricingRequest: (
    id: string,
    payload: Partial<IPricingRequest>,
  ) => Promise<IPricingRequest | undefined>;
}

export const INITIAL_STATE: IPricingRequestStateContext = {
  pricingRequests: [],
};

export const PricingRequestStateContext = createContext<
  IPricingRequestStateContext | undefined
>(undefined);

export const PricingRequestActionContext = createContext<
  IPricingRequestActionContext | undefined
>(undefined);
