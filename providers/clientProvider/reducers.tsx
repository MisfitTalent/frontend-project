import type { IClient } from "@/providers/salesTypes";

import { ClientActionEnums } from "./actions";
import { INITIAL_STATE, type IClientStateContext } from "./context";

type ClientAction =
  | { payload: IClient; type: ClientActionEnums.add }
  | { payload: string; type: ClientActionEnums.delete }
  | { payload: Partial<IClient> & { id: string }; type: ClientActionEnums.update };

export const ClientReducer = (
  state: IClientStateContext = INITIAL_STATE,
  action: ClientAction,
): IClientStateContext => {
  switch (action.type) {
    case ClientActionEnums.add:
      return { clients: [...state.clients, action.payload] };
    case ClientActionEnums.update:
      return {
        clients: state.clients.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item,
        ),
      };
    case ClientActionEnums.delete:
      return { clients: state.clients.filter((item) => item.id !== action.payload) };
    default:
      return state;
  }
};
