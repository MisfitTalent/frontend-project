"use client";

import { createContext } from "react";

export interface IUserLoginRequest {
  email?: string | null;
  password?: string | null;
}

export interface IUserRegisterRequest {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  password?: string | null;
  phoneNumber?: string | null;
  role?: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
}

export interface IUserLoginResponse {
  clientIds?: string[] | null;
  email?: string | null;
  expiresAt?: string;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[] | null;
  tenantId?: string | null;
  tenantName?: string | null;
  token?: string | null;
  userId?: string;
}

export interface IAuthStateContext {
  isAuthenticated: boolean;
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
  user?: IUserLoginResponse | null;
}

export interface IAuthActionContext {
  getMe: () => Promise<void>;
  login: (payload: IUserLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: IUserRegisterRequest) => Promise<void>;
}

export const INITIAL_STATE: IAuthStateContext = {
  isAuthenticated: false,
  isError: false,
  isPending: false,
  isSuccess: false,
  user: null,
};

export const AuthStateContext = createContext<IAuthStateContext>(INITIAL_STATE);

export const AuthActionContext = createContext<IAuthActionContext>(undefined!);
