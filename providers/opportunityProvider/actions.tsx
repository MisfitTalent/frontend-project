import type { IOpportunity } from "@/providers/salesTypes";

export enum OpportunityActionEnums {
  add = "ADD_OPPORTUNITY",
  delete = "DELETE_OPPORTUNITY",
  update = "UPDATE_OPPORTUNITY",
}

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
