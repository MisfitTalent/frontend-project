import { createContext } from "react";

import type { IContact } from "@/providers/salesTypes";

export interface IContactStateContext {
  contacts: IContact[];
}

export interface IContactActionContext {
  addContact: (payload: IContact) => Promise<IContact>;
  deleteContact: (id: string) => Promise<void>;
  updateContact: (id: string, payload: Partial<IContact>) => Promise<IContact | undefined>;
}

export const INITIAL_STATE: IContactStateContext = {
  contacts: [],
};

export const ContactStateContext = createContext<IContactStateContext | undefined>(
  undefined,
);

export const ContactActionContext = createContext<IContactActionContext | undefined>(
  undefined,
);
