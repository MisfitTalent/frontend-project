import { createContext } from "react";

import type { IContract, IRenewal } from "@/providers/salesTypes";

export interface IContractStateContext {
  contracts: IContract[];
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
  renewals: [],
};

export const ContractStateContext = createContext<IContractStateContext | undefined>(
  undefined,
);

export const ContractActionContext = createContext<IContractActionContext | undefined>(
  undefined,
);
