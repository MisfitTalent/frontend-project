import { handleActions } from "redux-actions";
import { ProfileActionEnums } from "./actions";
import { INITIAL_STATE, type IProfileSnapshot, type IProfileStateContext } from "./context";

export const ProfileReducer = handleActions<IProfileStateContext, IProfileSnapshot | undefined>(
  {
    [ProfileActionEnums.sync]: (state, action) => ({
      ...state,
      ...action.payload,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ProfileActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [ProfileActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ProfileActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  INITIAL_STATE,
);
