"use client";
import { ConfigProvider, theme } from "antd";
import type { ThemeConfig } from "antd";
import { useContext, useMemo, useReducer } from "react";
import { PROVIDER_REQUEST_SUCCESS } from "@/providers/provider-state";
import { setUiThemeAction } from "./actions";
import { UiActionContext, UiStateContext } from "./context";
import { UiReducer } from "./reducers";
type UiProviderProps = Readonly<{
    children: React.ReactNode;
}>;
export const useUiState = () => {
    const context = useContext(UiStateContext);
    if (context === undefined) {
        throw new Error("useUiState must be used within UiProvider.");
    }
    return context;
};
export const useUiActions = () => {
    const context = useContext(UiActionContext);
    if (context === undefined) {
        throw new Error("useUiActions must be used within UiProvider.");
    }
    return context;
};
export const UiProvider = ({ children }: UiProviderProps) => {
    const antdTheme = useMemo<ThemeConfig>(() => ({
        algorithm: theme.defaultAlgorithm,
        token: {
            borderRadius: 18,
            colorBgContainer: "#ffffff",
            colorBgLayout: "#eef3f8",
            colorError: "#b42318",
            colorInfo: "#355c7d",
            colorPrimary: "#f28c28",
            colorSuccess: "#355c7d",
            colorText: "#1f2937",
            colorWarning: "#f59e0b",
            fontFamily: "var(--font-geist-sans)",
        },
        components: {
            Button: {
                borderRadius: 999,
                controlHeight: 42,
                fontWeight: 600,
            },
            Card: {
                borderRadiusLG: 24,
            },
            Input: {
                controlHeight: 42,
            },
            Layout: {
                bodyBg: "#eef3f8",
                headerBg: "#1f365c",
                siderBg: "#1f365c",
            },
            Menu: {
                darkItemBg: "#1f365c",
                darkItemColor: "#d6deea",
                darkItemHoverBg: "#2e4a78",
                darkItemHoverColor: "#ffffff",
                darkItemSelectedBg: "#f28c28",
                darkItemSelectedColor: "#ffffff",
            },
            Select: {
                controlHeight: 42,
            },
            Table: {
                headerBg: "#e7edf4",
                rowHoverBg: "#f8fafc",
            },
        },
    }), []);
    const [state, dispatch] = useReducer(UiReducer, { antdTheme, ...PROVIDER_REQUEST_SUCCESS });
    return (<UiStateContext.Provider value={state}>
      <UiActionContext.Provider value={{
            setUiTheme: (payload) => dispatch(setUiThemeAction(payload)),
        }}>
        <ConfigProvider button={{ autoInsertSpace: false }} input={{ autoComplete: "off" }} theme={state.antdTheme}>
          {children}
        </ConfigProvider>
      </UiActionContext.Provider>
    </UiStateContext.Provider>);
};
