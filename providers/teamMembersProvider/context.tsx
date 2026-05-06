"use client";

import { createContext } from "react";

import type { ITeamMember } from "@/providers/salesTypes";

export interface ITeamMembersStateContext {
  teamMembers: ITeamMember[];
}

export interface ITeamMembersActionContext {
  syncTeamMembers: (payload: ITeamMember[]) => void;
}

export const INITIAL_STATE: ITeamMembersStateContext = {
  teamMembers: [],
};

export const TeamMembersStateContext = createContext<
  ITeamMembersStateContext | undefined
>(undefined);

export const TeamMembersActionContext = createContext<
  ITeamMembersActionContext | undefined
>(undefined);
