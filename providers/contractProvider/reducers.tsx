import { handleActions } from "redux-actions";
import type { IContract, IRenewal } from "@/providers/salesTypes";

import { ContractActionEnums } from "./actions";
import { INITIAL_STATE, type IContractStateContext } from "./context";

type ContractPayload =
  | IContract
  | IRenewal
  | string
  | (Partial<IContract> & { id: string })
  | (Partial<IRenewal> & { id: string })
  | undefined;

export const ContractReducer = handleActions<IContractStateContext, ContractPayload>(
  {
    [ContractActionEnums.addContract]: (state, action) => ({
      ...state,
      contracts: [...state.contracts, action.payload as IContract],
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ContractActionEnums.updateContract]: (state, action) => ({
      ...state,
      contracts: state.contracts.map((item) =>
        item.id === (action.payload as Partial<IContract> & { id: string }).id
          ? { ...item, ...(action.payload as Partial<IContract> & { id: string }) }
          : item,
      ),
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ContractActionEnums.deleteContract]: (state, action) => ({
      ...state,
      contracts: state.contracts.filter((item) => item.id !== (action.payload as string)),
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ContractActionEnums.addRenewal]: (state, action) => ({
      ...state,
      renewals: [...state.renewals, action.payload as IRenewal],
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ContractActionEnums.updateRenewal]: (state, action) => ({
      ...state,
      renewals: state.renewals.map((item) =>
        item.id === (action.payload as Partial<IRenewal> & { id: string }).id
          ? { ...item, ...(action.payload as Partial<IRenewal> & { id: string }) }
          : item,
      ),
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ContractActionEnums.deleteRenewal]: (state, action) => ({
      ...state,
      renewals: state.renewals.filter((item) => item.id !== (action.payload as string)),
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ContractActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [ContractActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ContractActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  INITIAL_STATE,
);
