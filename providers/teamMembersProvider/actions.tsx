import type { ITeamMember } from "@/providers/salesTypes";

export enum TeamMembersActionEnums {
  sync = "SYNC_TEAM_MEMBERS",
}

export const syncTeamMembersAction = (payload: ITeamMember[]) =>
  ({
    payload,
    type: TeamMembersActionEnums.sync,
  }) as const;
