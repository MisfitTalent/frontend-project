import type { IProposal } from "@/providers/salesTypes";

export enum ProposalActionEnums {
  add = "ADD_PROPOSAL",
  delete = "DELETE_PROPOSAL",
  update = "UPDATE_PROPOSAL",
}

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
