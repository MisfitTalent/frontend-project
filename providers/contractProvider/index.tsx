"use client";
import { useContext, useReducer } from "react";
import { initialContracts, initialRenewals } from "@/providers/domainSeeds";
import { PROVIDER_REQUEST_SUCCESS } from "@/providers/provider-state";
import { addContractAction, addRenewalAction, deleteContractAction, deleteRenewalAction, updateContractAction, updateRenewalAction, } from "./actions";
import { ContractActionContext, ContractStateContext } from "./context";
import { ContractReducer } from "./reducers";
export const useContractState = () => {
    const context = useContext(ContractStateContext);
    if (context === undefined) {
        throw new Error("useContractState must be used within ContractProvider.");
    }
    return context;
};
export const useContractActions = () => {
    const context = useContext(ContractActionContext);
    if (context === undefined) {
        throw new Error("useContractActions must be used within ContractProvider.");
    }
    return context;
};
export const ContractProvider = ({ children, }: Readonly<{
    children: React.ReactNode;
}>) => {
    const [state, dispatch] = useReducer(ContractReducer, {
        contracts: initialContracts(),
        ...PROVIDER_REQUEST_SUCCESS,
        renewals: initialRenewals(),
    });
    return (<ContractStateContext.Provider value={state}>
      <ContractActionContext.Provider value={{
            addContract: (payload) => dispatch(addContractAction(payload)),
            addRenewal: (payload) => dispatch(addRenewalAction(payload)),
            deleteContract: (id) => dispatch(deleteContractAction(id)),
            deleteRenewal: (id) => dispatch(deleteRenewalAction(id)),
            updateContract: (id, payload) => dispatch(updateContractAction({ id, ...payload })),
            updateRenewal: (id, payload) => dispatch(updateRenewalAction({ id, ...payload })),
        }}>
        {children}
      </ContractActionContext.Provider>
    </ContractStateContext.Provider>);
};
