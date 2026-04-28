import { createAction } from "redux-actions";

import type {
  IAuthStateContext,
  IUserLoginResponse,
} from "./context";

export enum AuthActionEnums {
  getMeError = "GET_ME_ERROR",
  getMePending = "GET_ME_PENDING",
  getMeSuccess = "GET_ME_SUCCESS",
  loginError = "LOGIN_ERROR",
  loginPending = "LOGIN_PENDING",
  loginSuccess = "LOGIN_SUCCESS",
  logoutError = "LOGOUT_ERROR",
  logoutPending = "LOGOUT_PENDING",
  logoutSuccess = "LOGOUT_SUCCESS",
  registerError = "REGISTER_ERROR",
  registerPending = "REGISTER_PENDING",
  registerSuccess = "REGISTER_SUCCESS",
}

export const loginPending = createAction<Partial<IAuthStateContext>>(
  AuthActionEnums.loginPending,
  () => ({
    isError: false,
    isPending: true,
    isSuccess: false,
    isAuthenticated: false,
  }),
);

export const loginSuccess = createAction<
  Partial<IAuthStateContext>,
  IUserLoginResponse
>(
  AuthActionEnums.loginSuccess,
  (user: IUserLoginResponse) => ({
    isAuthenticated: true,
    isError: false,
    isPending: false,
    isSuccess: true,
    user,
  }),
);

export const loginError = createAction<Partial<IAuthStateContext>>(
  AuthActionEnums.loginError,
  () => ({
    isAuthenticated: false,
    isError: true,
    isPending: false,
    isSuccess: false,
    user: null,
  }),
);

export const registerPending = createAction<Partial<IAuthStateContext>>(
  AuthActionEnums.registerPending,
  () => ({
    isError: false,
    isPending: true,
    isSuccess: false,
    isAuthenticated: false,
  }),
);

export const registerSuccess = createAction<
  Partial<IAuthStateContext>,
  IUserLoginResponse
>(
  AuthActionEnums.registerSuccess,
  (user: IUserLoginResponse) => ({
    isAuthenticated: true,
    isError: false,
    isPending: false,
    isSuccess: true,
    user,
  }),
);

export const registerError = createAction<Partial<IAuthStateContext>>(
  AuthActionEnums.registerError,
  () => ({
    isAuthenticated: false,
    isError: true,
    isPending: false,
    isSuccess: false,
    user: null,
  }),
);

export const logoutPending = createAction<Partial<IAuthStateContext>>(
  AuthActionEnums.logoutPending,
  () => ({
    isAuthenticated: false,
    isError: false,
    isPending: true,
    isSuccess: false,
  }),
);

export const logoutSuccess = createAction<Partial<IAuthStateContext>>(
  AuthActionEnums.logoutSuccess,
  () => ({
    isAuthenticated: false,
    isError: false,
    isPending: false,
    isSuccess: false,
    user: null,
  }),
);

export const logoutError = createAction<Partial<IAuthStateContext>>(
  AuthActionEnums.logoutError,
  () => ({
    isAuthenticated: false,
    isError: true,
    isPending: false,
    isSuccess: false,
    user: null,
  }),
);

export const getMePending = createAction<Partial<IAuthStateContext>>(
  AuthActionEnums.getMePending,
  () => ({
    isAuthenticated: false,
    isError: false,
    isPending: true,
    isSuccess: false,
  }),
);

export const getMeSuccess = createAction<
  Partial<IAuthStateContext>,
  IUserLoginResponse
>(
  AuthActionEnums.getMeSuccess,
  (user: IUserLoginResponse) => ({
    isAuthenticated: true,
    isError: false,
    isPending: false,
    isSuccess: true,
    user,
  }),
);

export const getMeError = createAction<Partial<IAuthStateContext>>(
  AuthActionEnums.getMeError,
  () => ({
    isAuthenticated: false,
    isError: true,
    isPending: false,
    isSuccess: false,
    user: null,
  }),
);
