import type { IOpportunity } from "@/providers/salesTypes";

export enum OpportunityActionEnums {
  add = "ADD_OPPORTUNITY",
  delete = "DELETE_OPPORTUNITY",
  error = "OPPORTUNITY_ERROR",
  pending = "OPPORTUNITY_PENDING",
  set = "SET_OPPORTUNITIES",
  success = "OPPORTUNITY_SUCCESS",
  update = "UPDATE_OPPORTUNITY",
}

export const opportunityPendingAction = () =>
  ({
    payload: undefined,
    type: OpportunityActionEnums.pending,
  }) as const;

export const opportunitySuccessAction = () =>
  ({
    payload: undefined,
    type: OpportunityActionEnums.success,
  }) as const;

export const opportunityErrorAction = () =>
  ({
    payload: undefined,
    type: OpportunityActionEnums.error,
  }) as const;

export const setOpportunitiesAction = (payload: IOpportunity[]) =>
  ({
    payload,
    type: OpportunityActionEnums.set,
  }) as const;

export const addOpportunityAction = (payload: IOpportunity) =>
  ({
    payload,
    type: OpportunityActionEnums.add,
  }) as const;

export const deleteOpportunityAction = (payload: string) =>
  ({
    payload,
    type: OpportunityActionEnums.delete,
  }) as const;

export const updateOpportunityAction = (
  payload: Partial<IOpportunity> & { id: string },
) =>
  ({
    payload,
    type: OpportunityActionEnums.update,
  }) as const;
