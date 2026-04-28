import type { IPricingRequest } from "@/providers/salesTypes";

import { PricingRequestActionEnums } from "./actions";
import { INITIAL_STATE, type IPricingRequestStateContext } from "./context";

type PricingRequestAction =
  | { payload: IPricingRequest; type: PricingRequestActionEnums.add }
  | { payload: string; type: PricingRequestActionEnums.delete }
  | {
      payload: Partial<IPricingRequest> & { id: string };
      type: PricingRequestActionEnums.update;
    };

export const PricingRequestReducer = (
  state: IPricingRequestStateContext = INITIAL_STATE,
  action: PricingRequestAction,
): IPricingRequestStateContext => {
  switch (action.type) {
    case PricingRequestActionEnums.add:
      return { pricingRequests: [...state.pricingRequests, action.payload] };
    case PricingRequestActionEnums.update:
      return {
        pricingRequests: state.pricingRequests.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item,
        ),
      };
    case PricingRequestActionEnums.delete:
      return {
        pricingRequests: state.pricingRequests.filter(
          (item) => item.id !== action.payload,
        ),
      };
    default:
      return state;
  }
};
