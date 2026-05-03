import type { IProposal } from "@/providers/salesTypes";

export enum ProposalActionEnums {
  add = "ADD_PROPOSAL",
  delete = "DELETE_PROPOSAL",
  error = "PROPOSAL_ERROR",
  pending = "PROPOSAL_PENDING",
  set = "SET_PROPOSALS",
  success = "PROPOSAL_SUCCESS",
  update = "UPDATE_PROPOSAL",
}

export const proposalPendingAction = () =>
  ({
    payload: undefined,
    type: ProposalActionEnums.pending,
  }) as const;

export const proposalSuccessAction = () =>
  ({
    payload: undefined,
    type: ProposalActionEnums.success,
  }) as const;

export const proposalErrorAction = () =>
  ({
    payload: undefined,
    type: ProposalActionEnums.error,
  }) as const;

export const setProposalsAction = (payload: IProposal[]) =>
  ({
    payload,
    type: ProposalActionEnums.set,
  }) as const;

export const addProposalAction = (payload: IProposal) =>
  ({
    payload,
    type: ProposalActionEnums.add,
  }) as const;

export const deleteProposalAction = (payload: string) =>
  ({
    payload,
    type: ProposalActionEnums.delete,
  }) as const;

export const updateProposalAction = (payload: Partial<IProposal> & { id: string }) =>
  ({
    payload,
    type: ProposalActionEnums.update,
  }) as const;
