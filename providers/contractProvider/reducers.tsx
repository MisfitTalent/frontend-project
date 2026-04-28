import type { IContract, IRenewal } from "@/providers/salesTypes";

import { ContractActionEnums } from "./actions";
import { INITIAL_STATE, type IContractStateContext } from "./context";

type ContractAction =
  | { payload: IContract; type: ContractActionEnums.addContract }
  | { payload: IRenewal; type: ContractActionEnums.addRenewal }
  | {
      payload: string;
      type:
        | ContractActionEnums.deleteContract
        | ContractActionEnums.deleteRenewal;
    }
  | {
      payload: Partial<IContract> & { id: string };
      type: ContractActionEnums.updateContract;
    }
  | {
      payload: Partial<IRenewal> & { id: string };
      type: ContractActionEnums.updateRenewal;
    };

export const ContractReducer = (
  state: IContractStateContext = INITIAL_STATE,
  action: ContractAction,
): IContractStateContext => {
  switch (action.type) {
    case ContractActionEnums.addContract:
      return { ...state, contracts: [...state.contracts, action.payload] };
    case ContractActionEnums.updateContract:
      return {
        ...state,
        contracts: state.contracts.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item,
        ),
      };
    case ContractActionEnums.deleteContract:
      return {
        ...state,
        contracts: state.contracts.filter((item) => item.id !== action.payload),
      };
    case ContractActionEnums.addRenewal:
      return { ...state, renewals: [...state.renewals, action.payload] };
    case ContractActionEnums.updateRenewal:
      return {
        ...state,
        renewals: state.renewals.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item,
        ),
      };
    case ContractActionEnums.deleteRenewal:
      return {
        ...state,
        renewals: state.renewals.filter((item) => item.id !== action.payload),
      };
    default:
      return state;
  }
};
