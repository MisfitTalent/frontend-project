import type { IClient } from "@/providers/salesTypes";

export enum ClientActionEnums {
  add = "ADD_CLIENT",
  delete = "DELETE_CLIENT",
  error = "CLIENT_ERROR",
  pending = "CLIENT_PENDING",
  set = "SET_CLIENTS",
  success = "CLIENT_SUCCESS",
  update = "UPDATE_CLIENT",
}

export const clientPendingAction = () =>
  ({
    payload: undefined,
    type: ClientActionEnums.pending,
  }) as const;

export const clientSuccessAction = () =>
  ({
    payload: undefined,
    type: ClientActionEnums.success,
  }) as const;

export const clientErrorAction = () =>
  ({
    payload: undefined,
    type: ClientActionEnums.error,
  }) as const;

export const setClientsAction = (payload: IClient[]) =>
  ({
    payload,
    type: ClientActionEnums.set,
  }) as const;

export const addClientAction = (payload: IClient) =>
  ({
    payload,
    type: ClientActionEnums.add,
  }) as const;

export const deleteClientAction = (payload: string) =>
  ({
    payload,
    type: ClientActionEnums.delete,
  }) as const;

export const updateClientAction = (payload: Partial<IClient> & { id: string }) =>
  ({
    payload,
    type: ClientActionEnums.update,
  }) as const;
