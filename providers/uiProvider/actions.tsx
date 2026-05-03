import type { ThemeConfig } from "antd";

export enum UiActionEnums {
  error = "UI_ERROR",
  pending = "UI_PENDING",
  setTheme = "SET_UI_THEME",
  success = "UI_SUCCESS",
}

export const uiPendingAction = () =>
  ({
    payload: undefined,
    type: UiActionEnums.pending,
  }) as const;

export const uiSuccessAction = () =>
  ({
    payload: undefined,
    type: UiActionEnums.success,
  }) as const;

export const uiErrorAction = () =>
  ({
    payload: undefined,
    type: UiActionEnums.error,
  }) as const;

export const setUiThemeAction = (payload: ThemeConfig) =>
  ({
    payload,
    type: UiActionEnums.setTheme,
  }) as const;
