import { createContext } from "react";

import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import type { IProposal, ProposalStatus } from "@/providers/salesTypes";

export interface IProposalStateContext {
  proposals: IProposal[];
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
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
  ...PROVIDER_REQUEST_IDLE,
};

export const ProposalStateContext = createContext<IProposalStateContext | undefined>(
  undefined,
);

export const ProposalActionContext = createContext<IProposalActionContext | undefined>(
  undefined,
);
