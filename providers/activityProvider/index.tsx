"use client";
import { useCallback, useContext, useEffect, useReducer } from "react";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole } from "@/lib/auth/roles";
import { type BackendActivityDto, type BackendPagedResult, backendRequest, buildCompleteActivityPayload, buildCreateActivityPayload, buildUpdateActivityPayload, coerceItems, mapBackendActivity, } from "@/lib/client/backend-api";
import { useAuthState } from "@/providers/authProvider";
import { initialActivities } from "@/providers/domainSeeds";
import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import { ActivityStatus, type IActivity } from "@/providers/salesTypes";
import { activityErrorAction, activityPendingAction, addActivityAction, deleteActivityAction, setActivitiesAction, updateActivityAction, } from "./actions";
import { ActivityActionContext, ActivityStateContext, INITIAL_STATE } from "./context";
import { ActivityReducer } from "./reducers";
export const useActivityState = () => {
    const context = useContext(ActivityStateContext);
    if (context === undefined) {
        throw new Error("useActivityState must be used within ActivityProvider.");
    }
    return context;
};
export const useActivityActions = () => {
    const context = useContext(ActivityActionContext);
    if (context === undefined) {
        throw new Error("useActivityActions must be used within ActivityProvider.");
    }
    return context;
};
type ActivityProviderProps = Readonly<{
    children: React.ReactNode;
}>;
export const ActivityProvider = ({ children, }: ActivityProviderProps) => {
    const { isAuthenticated, user } = useAuthState();
    const [state, dispatch] = useReducer(ActivityReducer, INITIAL_STATE);
    const isDemoMode = Boolean(user?.isMockSession);
    const role = getPrimaryUserRole(user?.roles);
    const isClientScoped = isClientScopedUser(user?.clientIds);
    const listPath = role === "SalesRep" && !isClientScoped
        ? "/api/activities/my-activities?pageNumber=1&pageSize=100"
        : "/api/Activities?pageNumber=1&pageSize=100";
    const loadActivities = useCallback(async () => {
        dispatch(activityPendingAction());
        const payload = await backendRequest<BackendPagedResult<BackendActivityDto> | BackendActivityDto[]>(listPath);
        dispatch(setActivitiesAction(coerceItems(payload).map(mapBackendActivity)));
    }, [listPath]);
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }
        let isActive = true;
        if (isDemoMode) {
            const timer = window.setTimeout(() => {
                void loadActivities().catch((error) => {
                    console.error(error);
                    if (isActive) {
                        dispatch(setActivitiesAction(initialActivities()));
                    }
                });
            }, 0);
            const handleWorkspaceUpdate = () => {
                void loadActivities().catch((error) => {
                    console.error(error);
                });
            };
            window.addEventListener("mock-workspace-updated", handleWorkspaceUpdate);
            return () => {
                isActive = false;
                window.clearTimeout(timer);
                window.removeEventListener("mock-workspace-updated", handleWorkspaceUpdate);
            };
        }
        void backendRequest<BackendPagedResult<BackendActivityDto> | BackendActivityDto[]>(listPath)
            .then((payload) => {
            if (!isActive) {
                return;
            }
            dispatch(setActivitiesAction(coerceItems(payload).map(mapBackendActivity)));
        })
            .catch((error) => {
            console.error(error);
            if (isActive) {
                dispatch(activityErrorAction());
            }
        });
        return () => {
            isActive = false;
        };
    }, [dispatch, isAuthenticated, isDemoMode, listPath, loadActivities]);
    return (<ActivityStateContext.Provider value={{
            ...(isAuthenticated ? state : { ...state, ...PROVIDER_REQUEST_IDLE }),
            activities: isAuthenticated ? state.activities : [],
        }}>
      <ActivityActionContext.Provider value={{
            addActivity: async (payload) => {
                dispatch(activityPendingAction());
                try {
                    const nextActivity = mapBackendActivity(await backendRequest<BackendActivityDto>("/api/Activities", {
                        body: JSON.stringify(buildCreateActivityPayload(payload)),
                        method: "POST",
                    }));
                    dispatch(addActivityAction(nextActivity));
                    return nextActivity;
                }
                catch (error) {
                    dispatch(activityErrorAction());
                    throw error;
                }
            },
            deleteActivity: async (id) => {
                dispatch(activityPendingAction());
                try {
                    if (!isDemoMode) {
                        await backendRequest<void>(`/api/Activities/${id}`, {
                            method: "DELETE",
                        });
                    }
                    dispatch(deleteActivityAction(id));
                }
                catch (error) {
                    dispatch(activityErrorAction());
                    throw error;
                }
            },
            updateActivity: async (id, payload) => {
                const existing = state.activities.find((item) => item.id === id);
                if (!existing) {
                    return undefined;
                }
                const nextActivity = { ...existing, ...payload };
                dispatch(activityPendingAction());
                try {
                    if (isDemoMode) {
                        dispatch(updateActivityAction(nextActivity));
                        return nextActivity;
                    }
                    let mappedActivity: IActivity;
                    if (!existing.completed && nextActivity.completed) {
                        mappedActivity = mapBackendActivity(await backendRequest<BackendActivityDto>(`/api/Activities/${id}/complete`, {
                            body: JSON.stringify(buildCompleteActivityPayload(nextActivity)),
                            method: "PUT",
                        }));
                    }
                    else if (nextActivity.status === ActivityStatus.Cancelled) {
                        mappedActivity = mapBackendActivity(await backendRequest<BackendActivityDto>(`/api/Activities/${id}/cancel`, {
                            method: "PUT",
                        }));
                    }
                    else {
                        mappedActivity = mapBackendActivity(await backendRequest<BackendActivityDto>(`/api/Activities/${id}`, {
                            body: JSON.stringify(buildUpdateActivityPayload(nextActivity)),
                            method: "PUT",
                        }));
                    }
                    dispatch(updateActivityAction(mappedActivity));
                    return mappedActivity;
                }
                catch (error) {
                    dispatch(activityErrorAction());
                    throw error;
                }
            },
        }}>
        {children}
      </ActivityActionContext.Provider>
    </ActivityStateContext.Provider>);
};
