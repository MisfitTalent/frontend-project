import type { IContract, IRenewal } from "@/providers/salesTypes";

export enum ContractActionEnums {
  addContract = "ADD_CONTRACT",
  addRenewal = "ADD_RENEWAL",
  deleteContract = "DELETE_CONTRACT",
  deleteRenewal = "DELETE_RENEWAL",
  updateContract = "UPDATE_CONTRACT",
  updateRenewal = "UPDATE_RENEWAL",
}

export const addContractAction = (payload: IContract) =>
  ({
    payload,
    type: ContractActionEnums.addContract,
  }) as const;

export const addRenewalAction = (payload: IRenewal) =>
  ({
    payload,
    type: ContractActionEnums.addRenewal,
  }) as const;

export const deleteContractAction = (payload: string) =>
  ({
    payload,
    type: ContractActionEnums.deleteContract,
  }) as const;

export const deleteRenewalAction = (payload: string) =>
  ({
    payload,
    type: ContractActionEnums.deleteRenewal,
  }) as const;

export const updateContractAction = (payload: Partial<IContract> & { id: string }) =>
  ({
    payload,
    type: ContractActionEnums.updateContract,
  }) as const;

export const updateRenewalAction = (payload: Partial<IRenewal> & { id: string }) =>
  ({
    payload,
    type: ContractActionEnums.updateRenewal,
  }) as const;
