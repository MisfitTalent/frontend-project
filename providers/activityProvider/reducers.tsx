import type { IActivity } from "@/providers/salesTypes";

import { ActivityActionEnums } from "./actions";
import { INITIAL_STATE, type IActivityStateContext } from "./context";

type ActivityAction =
  | { payload: IActivity; type: ActivityActionEnums.add }
  | { payload: string; type: ActivityActionEnums.delete }
  | {
      payload: Partial<IActivity> & { id: string };
      type: ActivityActionEnums.update;
    };

export const ActivityReducer = (
  state: IActivityStateContext = INITIAL_STATE,
  action: ActivityAction,
): IActivityStateContext => {
  switch (action.type) {
    case ActivityActionEnums.add:
      return { activities: [...state.activities, action.payload] };
    case ActivityActionEnums.update:
      return {
        activities: state.activities.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item,
        ),
      };
    case ActivityActionEnums.delete:
      return {
        activities: state.activities.filter((item) => item.id !== action.payload),
      };
    default:
      return state;
  }
};
