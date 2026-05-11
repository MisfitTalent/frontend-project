"use client";

import { useContext, useMemo, useReducer } from "react";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { useAuthState } from "@/providers/authProvider";
import { initialContracts, initialRenewals } from "@/providers/domainSeeds";
import {
  addContractAction,
  addRenewalAction,
  deleteContractAction,
  deleteRenewalAction,
  updateContractAction,
  updateRenewalAction,
} from "./actions";
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

export default function ContractProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuthState();
  const isScopedClient = isClientScopedUser(user?.clientIds);
  const scopedClientIds = useMemo(() => new Set(user?.clientIds ?? []), [user?.clientIds]);
  const [state, dispatch] = useReducer(ContractReducer, {
    contracts: initialContracts(),
    renewals: initialRenewals(),
  });
  const contracts = useMemo(
    () =>
      isScopedClient
        ? state.contracts.filter((contract) => scopedClientIds.has(contract.clientId))
        : state.contracts,
    [isScopedClient, scopedClientIds, state.contracts],
  );
  const contractIds = useMemo(() => new Set(contracts.map((contract) => contract.id)), [contracts]);
  const renewals = useMemo(
    () =>
      isScopedClient
        ? state.renewals.filter((renewal) => contractIds.has(renewal.contractId))
        : state.renewals,
    [contractIds, isScopedClient, state.renewals],
  );

  return (
    <ContractStateContext.Provider value={{ contracts, renewals }}>
      <ContractActionContext.Provider
        value={{
          addContract: (payload) => dispatch(addContractAction(payload)),
          addRenewal: (payload) => dispatch(addRenewalAction(payload)),
          deleteContract: (id) => dispatch(deleteContractAction(id)),
          deleteRenewal: (id) => dispatch(deleteRenewalAction(id)),
          updateContract: (id, payload) =>
            dispatch(updateContractAction({ id, ...payload })),
          updateRenewal: (id, payload) =>
            dispatch(updateRenewalAction({ id, ...payload })),
        }}
      >
        {children}
      </ContractActionContext.Provider>
    </ContractStateContext.Provider>
  );
}
