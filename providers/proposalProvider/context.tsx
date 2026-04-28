import { createContext } from "react";

import type { IProposal, ProposalStatus } from "@/providers/salesTypes";

export interface IProposalStateContext {
  proposals: IProposal[];
}

export interface IProposalActionContext {
  addProposal: (payload: IProposal) => Promise<IProposal>;
  deleteProposal: (id: string) => Promise<void>;
  transitionProposal: (
    id: string,
    status: ProposalStatus | string,
    decisionNote?: string,
  ) => Promise<IProposal | undefined>;
  updateProposal: (id: string, payload: Partial<IProposal>) => Promise<IProposal | undefined>;
}

export const INITIAL_STATE: IProposalStateContext = {
  proposals: [],
};

export const ProposalStateContext = createContext<IProposalStateContext | undefined>(
  undefined,
);

export const ProposalActionContext = createContext<IProposalActionContext | undefined>(
  undefined,
);
