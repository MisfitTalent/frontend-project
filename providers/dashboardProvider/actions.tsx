import type { IAutomationEvent } from "@/providers/salesTypes";

export enum DashboardActionEnums {
  addAutomationEvent = "ADD_AUTOMATION_EVENT",
}

export const addAutomationEventAction = (payload: IAutomationEvent) =>
  ({
    payload,
    type: DashboardActionEnums.addAutomationEvent,
  }) as const;
