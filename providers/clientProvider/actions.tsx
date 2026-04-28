import type { IClient } from "@/providers/salesTypes";

export enum ClientActionEnums {
  add = "ADD_CLIENT",
  delete = "DELETE_CLIENT",
  update = "UPDATE_CLIENT",
}

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
