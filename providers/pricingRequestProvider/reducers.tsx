import { handleActions } from "redux-actions";
import type { IPricingRequest } from "@/providers/salesTypes";

import { PricingRequestActionEnums } from "./actions";
import { INITIAL_STATE, type IPricingRequestStateContext } from "./context";

type PricingRequestPayload =
  | IPricingRequest
  | IPricingRequest[]
  | string
  | (Partial<IPricingRequest> & { id: string })
  | undefined;

export const PricingRequestReducer = handleActions<IPricingRequestStateContext, PricingRequestPayload>(
  {
    [PricingRequestActionEnums.add]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      pricingRequests: [...state.pricingRequests, action.payload as IPricingRequest],
    }),
    [PricingRequestActionEnums.update]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      pricingRequests: state.pricingRequests.map((item) =>
        item.id === (action.payload as Partial<IPricingRequest> & { id: string }).id
          ? { ...item, ...(action.payload as Partial<IPricingRequest> & { id: string }) }
          : item,
      ),
    }),
    [PricingRequestActionEnums.set]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      pricingRequests: action.payload as IPricingRequest[],
    }),
    [PricingRequestActionEnums.delete]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      pricingRequests: state.pricingRequests.filter((item) => item.id !== (action.payload as string)),
    }),
    [PricingRequestActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [PricingRequestActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [PricingRequestActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  INITIAL_STATE,
);
