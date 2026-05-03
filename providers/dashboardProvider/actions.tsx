import type { IAutomationEvent, ITeamMember } from "@/providers/salesTypes";

export enum DashboardActionEnums {
  addAutomationEvent = "ADD_AUTOMATION_EVENT",
  error = "DASHBOARD_ERROR",
  pending = "DASHBOARD_PENDING",
  setTeamMembers = "SET_TEAM_MEMBERS",
  success = "DASHBOARD_SUCCESS",
}

export const dashboardPendingAction = () =>
  ({
    payload: undefined,
    type: DashboardActionEnums.pending,
  }) as const;

export const dashboardSuccessAction = () =>
  ({
    payload: undefined,
    type: DashboardActionEnums.success,
  }) as const;

export const dashboardErrorAction = () =>
  ({
    payload: undefined,
    type: DashboardActionEnums.error,
  }) as const;

export const setTeamMembersAction = (payload: ITeamMember[]) =>
  ({
    payload,
    type: DashboardActionEnums.setTeamMembers,
  }) as const;

export const addAutomationEventAction = (payload: IAutomationEvent) =>
  ({
    payload,
    type: DashboardActionEnums.addAutomationEvent,
  }) as const;
