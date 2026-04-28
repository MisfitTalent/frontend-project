import { createContext } from "react";

import type { IClient } from "@/providers/salesTypes";

export interface IClientStateContext {
  clients: IClient[];
}

export interface IClientActionContext {
  addClient: (payload: IClient) => Promise<IClient>;
  deleteClient: (id: string) => Promise<void>;
  updateClient: (id: string, payload: Partial<IClient>) => Promise<IClient | undefined>;
}

export const INITIAL_STATE: IClientStateContext = {
  clients: [],
};

export const ClientStateContext = createContext<IClientStateContext | undefined>(
  undefined,
);

export const ClientActionContext = createContext<IClientActionContext | undefined>(
  undefined,
);
