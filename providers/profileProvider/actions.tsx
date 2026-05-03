import type { IProfileSnapshot } from "./context";

export enum ProfileActionEnums {
  error = "PROFILE_ERROR",
  pending = "PROFILE_PENDING",
  sync = "SYNC_PROFILE",
  success = "PROFILE_SUCCESS",
}

export const profilePendingAction = () =>
  ({
    payload: undefined,
    type: ProfileActionEnums.pending,
  }) as const;

export const profileSuccessAction = () =>
  ({
    payload: undefined,
    type: ProfileActionEnums.success,
  }) as const;

export const profileErrorAction = () =>
  ({
    payload: undefined,
    type: ProfileActionEnums.error,
  }) as const;

export const syncProfileAction = (payload: IProfileSnapshot) =>
  ({
    payload,
    type: ProfileActionEnums.sync,
  }) as const;
