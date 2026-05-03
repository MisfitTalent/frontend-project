import type { IContact } from "@/providers/salesTypes";

export enum ContactActionEnums {
  add = "ADD_CONTACT",
  delete = "DELETE_CONTACT",
  error = "CONTACT_ERROR",
  pending = "CONTACT_PENDING",
  set = "SET_CONTACTS",
  success = "CONTACT_SUCCESS",
  update = "UPDATE_CONTACT",
}

export const contactPendingAction = () =>
  ({
    payload: undefined,
    type: ContactActionEnums.pending,
  }) as const;

export const contactSuccessAction = () =>
  ({
    payload: undefined,
    type: ContactActionEnums.success,
  }) as const;

export const contactErrorAction = () =>
  ({
    payload: undefined,
    type: ContactActionEnums.error,
  }) as const;

export const setContactsAction = (payload: IContact[]) =>
  ({
    payload,
    type: ContactActionEnums.set,
  }) as const;

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
