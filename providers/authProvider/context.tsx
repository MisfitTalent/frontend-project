import { createContext } from "react";

import type {
  AuthLoginRequestDto,
  AuthRegisterRequestDto,
  AuthSessionUser,
} from "@/lib/auth/auth-contract";

export type IUserLoginRequest = AuthLoginRequestDto;
export type IUserRegisterRequest = AuthRegisterRequestDto;
export type IUserLoginResponse = AuthSessionUser;

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

export const AuthStateContext = createContext<IAuthStateContext | undefined>(undefined);

export const AuthActionContext = createContext<IAuthActionContext | undefined>(undefined);
