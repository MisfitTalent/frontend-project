import { ReportActionEnums } from "./actions";
import { INITIAL_STATE, type IReportStateContext } from "./context";

type ReportAction = {
  payload: IReportStateContext;
  type: ReportActionEnums.sync;
};

export const ReportReducer = (
  state: IReportStateContext = INITIAL_STATE,
  action: ReportAction,
): IReportStateContext => {
  switch (action.type) {
    case ReportActionEnums.sync:
      return action.payload;
    default:
      return state;
  }
};
