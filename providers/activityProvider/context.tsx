"use client";

import { createContext } from "react";

import type { IActivity } from "@/providers/salesTypes";

export interface IActivityStateContext {
  activities: IActivity[];
}

export interface IActivityActionContext {
  addActivity: (payload: IActivity) => Promise<IActivity>;
  deleteActivity: (id: string) => Promise<void>;
  updateActivity: (id: string, payload: Partial<IActivity>) => Promise<IActivity | undefined>;
}

export const INITIAL_STATE: IActivityStateContext = {
  activities: [],
};

export const ActivityStateContext = createContext<IActivityStateContext | undefined>(
  undefined,
);

export const ActivityActionContext = createContext<IActivityActionContext | undefined>(
  undefined,
);
