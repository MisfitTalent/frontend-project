import { handleActions } from "redux-actions";
import type { IContact } from "@/providers/salesTypes";

import { ContactActionEnums } from "./actions";
import { INITIAL_STATE, type IContactStateContext } from "./context";

type ContactPayload =
  | IContact
  | IContact[]
  | string
  | (Partial<IContact> & { id: string })
  | undefined;

export const ContactReducer = handleActions<IContactStateContext, ContactPayload>(
  {
    [ContactActionEnums.add]: (state, action) => ({
      ...state,
      contacts: [...state.contacts, action.payload as IContact],
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ContactActionEnums.update]: (state, action) => ({
      ...state,
      contacts: state.contacts.map((item) =>
        item.id === (action.payload as Partial<IContact> & { id: string }).id
          ? { ...item, ...(action.payload as Partial<IContact> & { id: string }) }
          : item,
      ),
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ContactActionEnums.set]: (state, action) => ({
      ...state,
      contacts: action.payload as IContact[],
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ContactActionEnums.delete]: (state, action) => ({
      ...state,
      contacts: state.contacts.filter((item) => item.id !== (action.payload as string)),
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ContactActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [ContactActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ContactActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  INITIAL_STATE,
);
