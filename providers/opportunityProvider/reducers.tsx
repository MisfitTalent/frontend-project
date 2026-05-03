import { handleActions } from "redux-actions";
import type { IOpportunity } from "@/providers/salesTypes";

import { OpportunityActionEnums } from "./actions";
import { INITIAL_STATE, type IOpportunityStateContext } from "./context";

type OpportunityPayload =
  | IOpportunity
  | IOpportunity[]
  | string
  | (Partial<IOpportunity> & { id: string })
  | undefined;

export const OpportunityReducer = handleActions<IOpportunityStateContext, OpportunityPayload>(
  {
    [OpportunityActionEnums.add]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      opportunities: [...state.opportunities, action.payload as IOpportunity],
    }),
    [OpportunityActionEnums.update]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      opportunities: state.opportunities.map((item) =>
        item.id === (action.payload as Partial<IOpportunity> & { id: string }).id
          ? { ...item, ...(action.payload as Partial<IOpportunity> & { id: string }) }
          : item,
      ),
    }),
    [OpportunityActionEnums.set]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      opportunities: action.payload as IOpportunity[],
    }),
    [OpportunityActionEnums.delete]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      opportunities: state.opportunities.filter((item) => item.id !== (action.payload as string)),
    }),
    [OpportunityActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [OpportunityActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [OpportunityActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  INITIAL_STATE,
);
