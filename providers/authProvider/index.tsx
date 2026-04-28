"use client";

import { useCallback, useContext, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";

import {
  clearAuthSession,
  getSessionToken,
  getStoredAuthUser,
  storeAuthSession,
} from "@/lib/client/auth-session";
import {
  getMePending,
  getMeSuccess,
  loginError,
  loginPending,
  loginSuccess,
  logoutError,
  logoutPending,
  logoutSuccess,
  registerError,
  registerPending,
  registerSuccess,
} from "./actions";
import {
  AuthActionContext,
  AuthStateContext,
  INITIAL_STATE,
  type IUserLoginRequest,
  type IUserLoginResponse,
  type IUserRegisterRequest,
} from "./context";
import { AuthReducer } from "./reducers";
export const useAuthState = () => {
  const context = useContext(AuthStateContext);

  if (context === undefined) {
    throw new Error("useAuthState must be used within AuthProvider.");
  }

  return context;
};

export const useAuthActions = () => {
  const context = useContext(AuthActionContext);

  if (context === undefined) {
    throw new Error("useAuthActions must be used within AuthProvider.");
  }

  return context;
};

type AuthProviderProps = Readonly<{
  children: React.ReactNode;
}>;

const readJsonPayload = async <T,>(response: Response) => {
  const text = await response.text();

  if (!text.trim()) {
    return {} as T;
  }

  return JSON.parse(text) as T;
};

const authRequest = async <T,>(
  path: "/api/Auth/login" | "/api/Auth/me" | "/api/Auth/register",
  init: RequestInit = {},
) => {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers,
  });
  const payload = (await readJsonPayload<T & { message?: string }>(response));

  if (!response.ok) {
    throw new Error(payload.message ?? "Authentication failed.");
  }

  return payload;
};

const mergeAuthUser = (
  payload: Partial<IUserLoginResponse>,
  fallback?: IUserLoginResponse | null,
): IUserLoginResponse => ({
  ...fallback,
  ...payload,
  roles: payload.roles ?? fallback?.roles ?? null,
  token: payload.token ?? fallback?.token ?? getSessionToken(),
});

export default function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);
  const router = useRouter();

  const authenticate = async (
    path: "/api/Auth/login" | "/api/Auth/register",
    payload: IUserLoginRequest | IUserRegisterRequest,
  ) => {
    return authRequest<IUserLoginResponse>(path, {
      body: JSON.stringify(payload),
      method: "POST",
    });
  };

  const login = async (payload: IUserLoginRequest) => {
    dispatch(loginPending());

    await authenticate("/api/Auth/login", payload)
      .then((response) => {
        storeAuthSession(response);
        dispatch(loginSuccess(response));
        router.push("/dashboard");
      })
      .catch((error: unknown) => {
        dispatch(loginError());
        console.error(error);
      });
  };

  const register = async (payload: IUserRegisterRequest) => {
    dispatch(registerPending());

    await authenticate("/api/Auth/register", payload)
      .then((response) => {
        storeAuthSession(response);
        dispatch(registerSuccess(response));
        router.push("/dashboard");
      })
      .catch((error: unknown) => {
        dispatch(registerError());
        console.error(error);
      });
  };

  const logout = async () => {
    dispatch(logoutPending());

    try {
      await fetch("/api/Auth/logout", {
        method: "POST",
      }).catch(() => undefined);
      clearAuthSession();
      dispatch(logoutSuccess());
      router.push("/login");
    } catch (error) {
      console.error(error);
      dispatch(logoutError());
    }
  };

  const getMe = useCallback(async () => {
    dispatch(getMePending());
    const storedUser = getStoredAuthUser();
    const token = storedUser?.token ?? getSessionToken();

    if (!token) {
      clearAuthSession();
      dispatch(logoutSuccess());
      return;
    }

    try {
      const response = await authRequest<Partial<IUserLoginResponse>>("/api/Auth/me");
      const nextUser = mergeAuthUser(response, storedUser);

      storeAuthSession(nextUser);
      dispatch(getMeSuccess(nextUser));
      return;
    } catch (error) {
      console.error(error);
    }

    clearAuthSession();
    dispatch(logoutSuccess());
  }, []);

  useEffect(() => {
    void getMe();
  }, [getMe]);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthActionContext.Provider
        value={{
          getMe,
          login,
          logout,
          register,
        }}
      >
        {children}
      </AuthActionContext.Provider>
    </AuthStateContext.Provider>
  );
}
