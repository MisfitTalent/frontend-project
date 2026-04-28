import type { IProposal } from "@/providers/salesTypes";

import { ProposalActionEnums } from "./actions";
import { INITIAL_STATE, type IProposalStateContext } from "./context";

type ProposalAction =
  | { payload: IProposal; type: ProposalActionEnums.add }
  | { payload: string; type: ProposalActionEnums.delete }
  | { payload: Partial<IProposal> & { id: string }; type: ProposalActionEnums.update };

export const ProposalReducer = (
  state: IProposalStateContext = INITIAL_STATE,
  action: ProposalAction,
): IProposalStateContext => {
  switch (action.type) {
    case ProposalActionEnums.add:
      return { proposals: [...state.proposals, action.payload] };
    case ProposalActionEnums.update:
      return {
        proposals: state.proposals.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item,
        ),
      };
    case ProposalActionEnums.delete:
      return {
        proposals: state.proposals.filter((item) => item.id !== action.payload),
      };
    default:
      return state;
  }
};
