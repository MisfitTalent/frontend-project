import type { IPricingRequest } from "@/providers/salesTypes";

export enum PricingRequestActionEnums {
  add = "ADD_PRICING_REQUEST",
  delete = "DELETE_PRICING_REQUEST",
  error = "PRICING_REQUEST_ERROR",
  pending = "PRICING_REQUEST_PENDING",
  set = "SET_PRICING_REQUESTS",
  success = "PRICING_REQUEST_SUCCESS",
  update = "UPDATE_PRICING_REQUEST",
}

export const pricingRequestPendingAction = () =>
  ({
    payload: undefined,
    type: PricingRequestActionEnums.pending,
  }) as const;

export const pricingRequestSuccessAction = () =>
  ({
    payload: undefined,
    type: PricingRequestActionEnums.success,
  }) as const;

export const pricingRequestErrorAction = () =>
  ({
    payload: undefined,
    type: PricingRequestActionEnums.error,
  }) as const;

export const setPricingRequestsAction = (payload: IPricingRequest[]) =>
  ({
    payload,
    type: PricingRequestActionEnums.set,
  }) as const;

export const addPricingRequestAction = (payload: IPricingRequest) =>
  ({
    payload,
    type: PricingRequestActionEnums.add,
  }) as const;

export const deletePricingRequestAction = (payload: string) =>
  ({
    payload,
    type: PricingRequestActionEnums.delete,
  }) as const;

export const updatePricingRequestAction = (
  payload: Partial<IPricingRequest> & { id: string },
) =>
  ({
    payload,
    type: PricingRequestActionEnums.update,
  }) as const;
