import type { IContact } from "@/providers/salesTypes";

import { ContactActionEnums } from "./actions";
import { INITIAL_STATE, type IContactStateContext } from "./context";

type ContactAction =
  | { payload: IContact; type: ContactActionEnums.add }
  | { payload: string; type: ContactActionEnums.delete }
  | { payload: Partial<IContact> & { id: string }; type: ContactActionEnums.update };

export const ContactReducer = (
  state: IContactStateContext = INITIAL_STATE,
  action: ContactAction,
): IContactStateContext => {
  switch (action.type) {
    case ContactActionEnums.add:
      return { contacts: [...state.contacts, action.payload] };
    case ContactActionEnums.update:
      return {
        contacts: state.contacts.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item,
        ),
      };
    case ContactActionEnums.delete:
      return { contacts: state.contacts.filter((item) => item.id !== action.payload) };
    default:
      return state;
  }
};
