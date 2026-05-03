import type { IReportSnapshot } from "./context";

export enum ReportActionEnums {
  error = "REPORT_ERROR",
  pending = "REPORT_PENDING",
  sync = "SYNC_REPORT",
  success = "REPORT_SUCCESS",
}

export const reportPendingAction = () =>
  ({
    payload: undefined,
    type: ReportActionEnums.pending,
  }) as const;

export const reportSuccessAction = () =>
  ({
    payload: undefined,
    type: ReportActionEnums.success,
  }) as const;

export const reportErrorAction = () =>
  ({
    payload: undefined,
    type: ReportActionEnums.error,
  }) as const;

export const syncReportAction = (payload: IReportSnapshot) =>
  ({
    payload,
    type: ReportActionEnums.sync,
  }) as const;
