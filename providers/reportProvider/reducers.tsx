import { handleActions } from "redux-actions";
import { ReportActionEnums } from "./actions";
import { INITIAL_STATE, type IReportSnapshot, type IReportStateContext } from "./context";

export const ReportReducer = handleActions<IReportStateContext, IReportSnapshot | undefined>(
  {
    [ReportActionEnums.sync]: (state, action) => ({
      ...state,
      ...action.payload,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ReportActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [ReportActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ReportActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  INITIAL_STATE,
);
