import { handleActions } from "redux-actions";
import type { IProposal } from "@/providers/salesTypes";

import { ProposalActionEnums } from "./actions";
import { INITIAL_STATE, type IProposalStateContext } from "./context";

type ProposalPayload =
  | IProposal
  | IProposal[]
  | string
  | (Partial<IProposal> & { id: string })
  | undefined;

export const ProposalReducer = handleActions<IProposalStateContext, ProposalPayload>(
  {
    [ProposalActionEnums.add]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      proposals: [...state.proposals, action.payload as IProposal],
    }),
    [ProposalActionEnums.update]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      proposals: state.proposals.map((item) =>
        item.id === (action.payload as Partial<IProposal> & { id: string }).id
          ? { ...item, ...(action.payload as Partial<IProposal> & { id: string }) }
          : item,
      ),
    }),
    [ProposalActionEnums.set]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      proposals: action.payload as IProposal[],
    }),
    [ProposalActionEnums.delete]: (state, action) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
      proposals: state.proposals.filter((item) => item.id !== (action.payload as string)),
    }),
    [ProposalActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [ProposalActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ProposalActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  INITIAL_STATE,
);
