import type { ThemeConfig } from "antd";

export enum UiActionEnums {
  setTheme = "SET_UI_THEME",
}

export const setUiThemeAction = (payload: ThemeConfig) =>
  ({
    payload,
    type: UiActionEnums.setTheme,
  }) as const;
