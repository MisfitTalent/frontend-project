"use client";

import { useContext, useEffect, useReducer } from "react";

import { getOpenPipelineValue, getOpportunityInsights } from "@/providers/salesSelectors";
import { useDashboardState } from "@/providers/dashboardProvider";
import { syncReportAction } from "./actions";
import { ReportActionContext, ReportStateContext } from "./context";
import { ReportReducer } from "./reducers";

export const useReportState = () => {
  const context = useContext(ReportStateContext);

  if (context === undefined) {
    throw new Error("useReportState must be used within ReportProvider.");
  }

  return context;
};

export const useReportActions = () => {
  const context = useContext(ReportActionContext);

  if (context === undefined) {
    throw new Error("useReportActions must be used within ReportProvider.");
  }

  return context;
};

export default function ReportProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { salesData } = useDashboardState();
  const totalPipelineValue = getOpenPipelineValue(salesData);
  const opportunityInsights = getOpportunityInsights(salesData);
  const initialReportState = {
    averageDealValue: opportunityInsights.length
      ? Math.round(totalPipelineValue / opportunityInsights.length)
      : 0,
    opportunityInsights,
    totalPipelineValue,
  };
  const [state, dispatch] = useReducer(ReportReducer, initialReportState);

  useEffect(() => {
    const nextTotalPipelineValue = getOpenPipelineValue(salesData);
    const nextOpportunityInsights = getOpportunityInsights(salesData);
    const openOpportunityCount = nextOpportunityInsights.length;

    dispatch(
      syncReportAction({
        averageDealValue: openOpportunityCount
          ? Math.round(nextTotalPipelineValue / openOpportunityCount)
          : 0,
        opportunityInsights: nextOpportunityInsights,
        totalPipelineValue: nextTotalPipelineValue,
      }),
    );
  }, [salesData]);

  return (
    <ReportStateContext.Provider value={state}>
      <ReportActionContext.Provider
        value={{
          syncReport: (payload) => dispatch(syncReportAction(payload)),
        }}
      >
        {children}
      </ReportActionContext.Provider>
    </ReportStateContext.Provider>
  );
}
