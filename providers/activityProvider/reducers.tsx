import { handleActions } from "redux-actions";
import type { IActivity } from "@/providers/salesTypes";

import { ActivityActionEnums } from "./actions";
import { INITIAL_STATE, type IActivityStateContext } from "./context";

type ActivityPayload =
  | IActivity
  | IActivity[]
  | string
  | (Partial<IActivity> & { id: string })
  | undefined;

export const ActivityReducer = handleActions<IActivityStateContext, ActivityPayload>(
  {
    [ActivityActionEnums.add]: (state, action) => ({
      ...state,
      activities: [...state.activities, action.payload as IActivity],
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ActivityActionEnums.update]: (state, action) => ({
      ...state,
      activities: state.activities.map((item) =>
        item.id === (action.payload as Partial<IActivity> & { id: string }).id
          ? { ...item, ...(action.payload as Partial<IActivity> & { id: string }) }
          : item,
      ),
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ActivityActionEnums.set]: (state, action) => ({
      ...state,
      activities: action.payload as IActivity[],
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ActivityActionEnums.delete]: (state, action) => ({
      ...state,
      activities: state.activities.filter((item) => item.id !== (action.payload as string)),
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ActivityActionEnums.pending]: (state) => ({
      ...state,
      isError: false,
      isPending: true,
      isSuccess: false,
    }),
    [ActivityActionEnums.success]: (state) => ({
      ...state,
      isError: false,
      isPending: false,
      isSuccess: true,
    }),
    [ActivityActionEnums.error]: (state) => ({
      ...state,
      isError: true,
      isPending: false,
      isSuccess: false,
    }),
  },
  INITIAL_STATE,
);
