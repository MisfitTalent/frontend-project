import type { IOpportunity } from "@/providers/salesTypes";

import { OpportunityActionEnums } from "./actions";
import { INITIAL_STATE, type IOpportunityStateContext } from "./context";

type OpportunityAction =
  | { payload: IOpportunity; type: OpportunityActionEnums.add }
  | { payload: string; type: OpportunityActionEnums.delete }
  | {
      payload: Partial<IOpportunity> & { id: string };
      type: OpportunityActionEnums.update;
    };

export const OpportunityReducer = (
  state: IOpportunityStateContext = INITIAL_STATE,
  action: OpportunityAction,
): IOpportunityStateContext => {
  switch (action.type) {
    case OpportunityActionEnums.add:
      return { opportunities: [...state.opportunities, action.payload] };
    case OpportunityActionEnums.update:
      return {
        opportunities: state.opportunities.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item,
        ),
      };
    case OpportunityActionEnums.delete:
      return {
        opportunities: state.opportunities.filter(
          (item) => item.id !== action.payload,
        ),
      };
    default:
      return state;
  }
};
