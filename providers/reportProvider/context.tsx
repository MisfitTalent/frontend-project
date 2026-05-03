import { createContext } from "react";

import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import { getOpportunityInsights } from "@/providers/salesSelectors";

export interface IReportSnapshot {
  averageDealValue: number;
  opportunityInsights: ReturnType<typeof getOpportunityInsights>;
  totalPipelineValue: number;
}

export interface IReportStateContext extends IReportSnapshot {
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
}

export interface IReportActionContext {
  syncReport: (payload: IReportSnapshot) => void;
}

export const INITIAL_STATE: IReportStateContext = {
  averageDealValue: 0,
  ...PROVIDER_REQUEST_IDLE,
  opportunityInsights: [],
  totalPipelineValue: 0,
};

export const ReportStateContext = createContext<IReportStateContext | undefined>(
  undefined,
);

export const ReportActionContext = createContext<IReportActionContext | undefined>(
  undefined,
);
