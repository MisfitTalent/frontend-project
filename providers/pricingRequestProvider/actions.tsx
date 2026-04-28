import type { IPricingRequest } from "@/providers/salesTypes";

export enum PricingRequestActionEnums {
  add = "ADD_PRICING_REQUEST",
  delete = "DELETE_PRICING_REQUEST",
  update = "UPDATE_PRICING_REQUEST",
}

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
