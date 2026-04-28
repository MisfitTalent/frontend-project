import type { ThemeConfig } from "antd";

import { UiActionEnums } from "./actions";
import { INITIAL_STATE, type IUiStateContext } from "./context";

type UiAction = {
  payload: ThemeConfig;
  type: UiActionEnums.setTheme;
};

export const UiReducer = (
  state: IUiStateContext = INITIAL_STATE,
  action: UiAction,
): IUiStateContext => {
  switch (action.type) {
    case UiActionEnums.setTheme:
      return {
        antdTheme: action.payload,
      };
    default:
      return state;
  }
};
