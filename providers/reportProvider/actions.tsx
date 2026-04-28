import type { IReportStateContext } from "./context";

export enum ReportActionEnums {
  sync = "SYNC_REPORT",
}

export const syncReportAction = (payload: IReportStateContext) =>
  ({
    payload,
    type: ReportActionEnums.sync,
  }) as const;
