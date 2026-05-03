import { createContext } from "react";

import type { ThemeConfig } from "antd";
import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";

export interface IUiStateContext {
  antdTheme: ThemeConfig;
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
}

export interface IUiActionContext {
  setUiTheme: (payload: ThemeConfig) => void;
}

export const INITIAL_STATE: IUiStateContext = {
  antdTheme: {} as ThemeConfig,
  ...PROVIDER_REQUEST_IDLE,
};

export const UiStateContext = createContext<IUiStateContext | undefined>(undefined);

export const UiActionContext = createContext<IUiActionContext | undefined>(undefined);
