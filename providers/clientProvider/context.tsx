import { createContext } from "react";

import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import type { IClient } from "@/providers/salesTypes";

export interface IClientStateContext {
  clients: IClient[];
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
}

export interface IClientActionContext {
  addClient: (payload: IClient) => Promise<IClient>;
  deleteClient: (id: string) => Promise<void>;
  updateClient: (id: string, payload: Partial<IClient>) => Promise<IClient | undefined>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export const INITIAL_STATE: IClientStateContext = {
  clients: [],
  ...PROVIDER_REQUEST_IDLE,
  isError: false,
  isPending: false,
  isSuccess: false,
};

export const ClientStateContext = createContext<IClientStateContext | undefined>(
  undefined,
);

export const ClientActionContext = createContext<IClientActionContext | undefined>(
  undefined,
);
