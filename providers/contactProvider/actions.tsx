import type { IContact } from "@/providers/salesTypes";

export enum ContactActionEnums {
  add = "ADD_CONTACT",
  delete = "DELETE_CONTACT",
  update = "UPDATE_CONTACT",
}

export const addContactAction = (payload: IContact) =>
  ({
    payload,
    type: ContactActionEnums.add,
  }) as const;

export const deleteContactAction = (payload: string) =>
  ({
    payload,
    type: ContactActionEnums.delete,
  }) as const;

export const updateContactAction = (payload: Partial<IContact> & { id: string }) =>
  ({
    payload,
    type: ContactActionEnums.update,
  }) as const;
