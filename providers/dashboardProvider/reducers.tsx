import { handleActions } from "redux-actions";
import type { IAutomationEvent, ITeamMember } from "@/providers/salesTypes";
import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";

import { DashboardActionEnums } from "./actions";

export interface IDashboardReducerState {
  automationFeed: IAutomationEvent[];
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
  teamMembers: ITeamMember[];
}

type DashboardPayload = IAutomationEvent | ITeamMember[] | undefined;

export const DashboardReducer = handleActions<IDashboardReducerState, DashboardPayload>(
  {
    [DashboardActionEnums.addAutomationEvent]: (state, action) => ({
      ...state,
      automationFeed: action.payload
        ? [(action.payload as IAutomationEvent), ...state.automationFeed].slice(0, 12)
        : state.automationFeed,
    }),
    [DashboardActionEnums.setTeamMembers]: (state, action) => ({
      ...state,
      teamMembers: action.payload as ITeamMember[],
    }),
    [DashboardActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [DashboardActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [DashboardActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  {
    automationFeed: [],
    ...PROVIDER_REQUEST_IDLE,
    teamMembers: [],
  },
);
