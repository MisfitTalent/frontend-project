import { handleActions } from "redux-actions";
import type { ThemeConfig } from "antd";

import { UiActionEnums } from "./actions";
import { INITIAL_STATE, type IUiStateContext } from "./context";

export const UiReducer = handleActions<IUiStateContext, ThemeConfig | undefined>(
  {
    [UiActionEnums.setTheme]: (state, action) => ({
      antdTheme: action.payload ?? state.antdTheme,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [UiActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [UiActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [UiActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  INITIAL_STATE,
);
