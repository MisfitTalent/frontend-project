import { createContext } from "react";

import { getOpportunityInsights } from "@/providers/salesSelectors";

export interface IReportStateContext {
  averageDealValue: number;
  opportunityInsights: ReturnType<typeof getOpportunityInsights>;
  totalPipelineValue: number;
}

export interface IReportActionContext {
  syncReport: (payload: IReportStateContext) => void;
}

export const INITIAL_STATE: IReportStateContext = {
  averageDealValue: 0,
  opportunityInsights: [],
  totalPipelineValue: 0,
};

export const ReportStateContext = createContext<IReportStateContext | undefined>(
  undefined,
);

export const ReportActionContext = createContext<IReportActionContext | undefined>(
  undefined,
);
