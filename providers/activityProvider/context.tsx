import { createContext } from "react";

import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import type { IActivity } from "@/providers/salesTypes";

export interface IActivityStateContext {
  activities: IActivity[];
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
}

export interface IActivityActionContext {
  addActivity: (payload: IActivity) => Promise<IActivity>;
  deleteActivity: (id: string) => Promise<void>;
  updateActivity: (id: string, payload: Partial<IActivity>) => Promise<IActivity | undefined>;
}

export const INITIAL_STATE: IActivityStateContext = {
  activities: [],
  ...PROVIDER_REQUEST_IDLE,
};

export const ActivityStateContext = createContext<IActivityStateContext | undefined>(
  undefined,
);

export const ActivityActionContext = createContext<IActivityActionContext | undefined>(
  undefined,
);
