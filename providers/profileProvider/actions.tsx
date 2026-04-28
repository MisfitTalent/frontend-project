import type { IProfileStateContext } from "./context";

export enum ProfileActionEnums {
  sync = "SYNC_PROFILE",
}

export const syncProfileAction = (payload: IProfileStateContext) =>
  ({
    payload,
    type: ProfileActionEnums.sync,
  }) as const;
