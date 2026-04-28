import type { IAutomationEvent, ITeamMember } from "@/providers/salesTypes";

import { DashboardActionEnums } from "./actions";

export interface IDashboardReducerState {
  automationFeed: IAutomationEvent[];
  teamMembers: ITeamMember[];
}

type DashboardReducerAction = {
  payload: IAutomationEvent;
  type: DashboardActionEnums.addAutomationEvent;
};

export const DashboardReducer = (
  state: IDashboardReducerState,
  action: DashboardReducerAction,
): IDashboardReducerState => {
  switch (action.type) {
    case DashboardActionEnums.addAutomationEvent:
      return {
        ...state,
        automationFeed: [action.payload, ...state.automationFeed].slice(0, 12),
      };
    default:
      return state;
  }
};
