import { handleActions } from "redux-actions";
import type { IClient } from "@/providers/salesTypes";

import { ClientActionEnums } from "./actions";
import { INITIAL_STATE, type IClientStateContext } from "./context";

type ClientPayload =
  | IClient
  | IClient[]
  | string
  | (Partial<IClient> & { id: string })
  | undefined;

export const ClientReducer = handleActions<IClientStateContext, ClientPayload>(
  {
    [ClientActionEnums.add]: (state, action) => ({
      ...state,
      clients: [...state.clients, action.payload as IClient],
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ClientActionEnums.update]: (state, action) => ({
      ...state,
      clients: state.clients.map((item) =>
        item.id === (action.payload as Partial<IClient> & { id: string }).id
          ? { ...item, ...(action.payload as Partial<IClient> & { id: string }) }
          : item,
      ),
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ClientActionEnums.set]: (state, action) => ({
      ...state,
      clients: action.payload as IClient[],
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ClientActionEnums.delete]: (state, action) => ({
      ...state,
      clients: state.clients.filter((item) => item.id !== (action.payload as string)),
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ClientActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [ClientActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ClientActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  INITIAL_STATE,
);
