import type { IActivity } from "@/providers/salesTypes";

export enum ActivityActionEnums {
  add = "ADD_ACTIVITY",
  delete = "DELETE_ACTIVITY",
  error = "ACTIVITY_ERROR",
  pending = "ACTIVITY_PENDING",
  set = "SET_ACTIVITIES",
  success = "ACTIVITY_SUCCESS",
  update = "UPDATE_ACTIVITY",
}

export const activityPendingAction = () =>
  ({
    payload: undefined,
    type: ActivityActionEnums.pending,
  }) as const;

export const activitySuccessAction = () =>
  ({
    payload: undefined,
    type: ActivityActionEnums.success,
  }) as const;

export const activityErrorAction = () =>
  ({
    payload: undefined,
    type: ActivityActionEnums.error,
  }) as const;

export const setActivitiesAction = (payload: IActivity[]) =>
  ({
    payload,
    type: ActivityActionEnums.set,
  }) as const;

export const addActivityAction = (payload: IActivity) =>
  ({
    payload,
    type: ActivityActionEnums.add,
  }) as const;

export const deleteActivityAction = (payload: string) =>
  ({
    payload,
    type: ActivityActionEnums.delete,
  }) as const;

export const updateActivityAction = (
  payload: Partial<IActivity> & { id: string },
) =>
  ({
    payload,
    type: ActivityActionEnums.update,
  }) as const;
