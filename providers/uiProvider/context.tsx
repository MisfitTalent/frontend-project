"use client";

import { createContext } from "react";

import type { ThemeConfig } from "antd";

export interface IUiStateContext {
  antdTheme: ThemeConfig;
}

export interface IUiActionContext {
  setUiTheme: (payload: ThemeConfig) => void;
}

export const INITIAL_STATE: IUiStateContext = {
  antdTheme: {} as ThemeConfig,
};

export const UiStateContext = createContext<IUiStateContext | undefined>(undefined);

export const UiActionContext = createContext<IUiActionContext | undefined>(undefined);
