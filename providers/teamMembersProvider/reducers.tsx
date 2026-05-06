import type { ITeamMember } from "@/providers/salesTypes";

import { TeamMembersActionEnums } from "./actions";
import { INITIAL_STATE, type ITeamMembersStateContext } from "./context";

type TeamMembersAction = {
  payload: ITeamMember[];
  type: TeamMembersActionEnums.sync;
};

export const TeamMembersReducer = (
  state: ITeamMembersStateContext = INITIAL_STATE,
  action: TeamMembersAction,
): ITeamMembersStateContext => {
  switch (action.type) {
    case TeamMembersActionEnums.sync:
      return { teamMembers: action.payload };
    default:
      return state;
  }
};
