import { ProfileActionEnums } from "./actions";
import { INITIAL_STATE, type IProfileStateContext } from "./context";

type ProfileAction = {
  payload: IProfileStateContext;
  type: ProfileActionEnums.sync;
};

export const ProfileReducer = (
  state: IProfileStateContext = INITIAL_STATE,
  action: ProfileAction,
): IProfileStateContext => {
  switch (action.type) {
    case ProfileActionEnums.sync:
      return action.payload;
    default:
      return state;
  }
};
