import type { IActivity } from "@/providers/salesTypes";

export enum ActivityActionEnums {
  add = "ADD_ACTIVITY",
  delete = "DELETE_ACTIVITY",
  update = "UPDATE_ACTIVITY",
}

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
