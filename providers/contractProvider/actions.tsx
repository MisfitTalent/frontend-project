import type { IContract, IRenewal } from "@/providers/salesTypes";

export enum ContractActionEnums {
  addContract = "ADD_CONTRACT",
  addRenewal = "ADD_RENEWAL",
  deleteContract = "DELETE_CONTRACT",
  deleteRenewal = "DELETE_RENEWAL",
  error = "CONTRACT_ERROR",
  pending = "CONTRACT_PENDING",
  success = "CONTRACT_SUCCESS",
  updateContract = "UPDATE_CONTRACT",
  updateRenewal = "UPDATE_RENEWAL",
}

export const contractPendingAction = () =>
  ({
    payload: undefined,
    type: ContractActionEnums.pending,
  }) as const;

export const contractSuccessAction = () =>
  ({
    payload: undefined,
    type: ContractActionEnums.success,
  }) as const;

export const contractErrorAction = () =>
  ({
    payload: undefined,
    type: ContractActionEnums.error,
  }) as const;

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
