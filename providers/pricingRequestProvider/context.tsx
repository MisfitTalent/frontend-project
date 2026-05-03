import { createContext } from "react";

import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import type { IPricingRequest } from "@/providers/salesTypes";

export interface IPricingRequestStateContext {
  pricingRequests: IPricingRequest[];
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
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
  ...PROVIDER_REQUEST_IDLE,
};

export const PricingRequestStateContext = createContext<
  IPricingRequestStateContext | undefined
>(undefined);

export const PricingRequestActionContext = createContext<
  IPricingRequestActionContext | undefined
>(undefined);
