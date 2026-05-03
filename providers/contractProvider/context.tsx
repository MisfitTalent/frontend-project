import { createContext } from "react";

import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import type { IContract, IRenewal } from "@/providers/salesTypes";

export interface IContractStateContext {
  contracts: IContract[];
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
  renewals: IRenewal[];
}

export interface IContractActionContext {
  addContract: (payload: IContract) => void;
  addRenewal: (payload: IRenewal) => void;
  deleteContract: (id: string) => void;
  deleteRenewal: (id: string) => void;
  updateContract: (id: string, payload: Partial<IContract>) => void;
  updateRenewal: (id: string, payload: Partial<IRenewal>) => void;
}

export const INITIAL_STATE: IContractStateContext = {
  contracts: [],
  ...PROVIDER_REQUEST_IDLE,
  renewals: [],
};

export const ContractStateContext = createContext<IContractStateContext | undefined>(
  undefined,
);

export const ContractActionContext = createContext<IContractActionContext | undefined>(
  undefined,
);
