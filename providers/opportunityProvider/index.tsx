"use client";
import { useCallback, useContext, useEffect, useReducer } from "react";
import { getPrimaryUserRole } from "@/lib/auth/roles";
import { useAuthState } from "@/providers/authProvider";
import { initialOpportunities } from "@/providers/domainSeeds";
import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import { OpportunityStage, type IOpportunity } from "@/providers/salesTypes";
import { type BackendOpportunityDto, type BackendPagedResult, backendRequest, buildAssignOpportunityPayload, buildCreateOpportunityPayload, buildUpdateOpportunityPayload, buildUpdateOpportunityStagePayload, coerceItems, mapBackendOpportunity, } from "@/lib/client/backend-api";
import { addOpportunityAction, deleteOpportunityAction, opportunityErrorAction, opportunityPendingAction, setOpportunitiesAction, updateOpportunityAction, } from "./actions";
import { INITIAL_STATE, OpportunityActionContext, OpportunityStateContext } from "./context";
import { OpportunityReducer } from "./reducers";
export const useOpportunityState = () => {
    const context = useContext(OpportunityStateContext);
    if (context === undefined) {
        throw new Error("useOpportunityState must be used within OpportunityProvider.");
    }
    return context;
};
export const useOpportunityActions = () => {
    const context = useContext(OpportunityActionContext);
    if (context === undefined) {
        throw new Error("useOpportunityActions must be used within OpportunityProvider.");
    }
    return context;
};
export const OpportunityProvider = ({ children, }: Readonly<{
    children: React.ReactNode;
}>) => {
    const { isAuthenticated, user } = useAuthState();
    const [state, dispatch] = useReducer(OpportunityReducer, INITIAL_STATE);
    const isDemoMode = Boolean(user?.isMockSession);
    const role = getPrimaryUserRole(user?.roles);
    const loadOpportunities = useCallback(async () => {
        dispatch(opportunityPendingAction());
        const payload = await backendRequest<BackendPagedResult<BackendOpportunityDto> | BackendOpportunityDto[]>(role === "SalesRep"
            ? "/api/opportunities/my-opportunities?pageNumber=1&pageSize=100"
            : "/api/Opportunities?pageNumber=1&pageSize=100");
        dispatch(setOpportunitiesAction(coerceItems(payload).map(mapBackendOpportunity)));
    }, [role]);
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }
        let isActive = true;
        if (isDemoMode) {
            const timer = window.setTimeout(() => {
                void loadOpportunities().catch((error) => {
                    console.error(error);
                    if (isActive) {
                        dispatch(setOpportunitiesAction(initialOpportunities()));
                    }
                });
            }, 0);
            const handleWorkspaceUpdate = () => {
                void loadOpportunities().catch((error) => {
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
        void backendRequest<BackendPagedResult<BackendOpportunityDto> | BackendOpportunityDto[]>(role === "SalesRep"
            ? "/api/opportunities/my-opportunities?pageNumber=1&pageSize=100"
            : "/api/Opportunities?pageNumber=1&pageSize=100")
            .then((payload) => {
            if (!isActive) {
                return;
            }
            dispatch(setOpportunitiesAction(coerceItems(payload).map(mapBackendOpportunity)));
        })
            .catch((error) => {
            console.error(error);
            if (isActive) {
                dispatch(opportunityErrorAction());
            }
        });
        return () => {
            isActive = false;
        };
    }, [dispatch, isAuthenticated, isDemoMode, loadOpportunities, role]);
    const assignIfNeeded = async (opportunity: IOpportunity, ownerId?: string) => {
        if (!ownerId) {
            return opportunity;
        }
        const response = await backendRequest<BackendOpportunityDto>(`/api/Opportunities/${opportunity.id}/assign`, {
            body: JSON.stringify(buildAssignOpportunityPayload(ownerId)),
            method: "POST",
        });
        return mapBackendOpportunity(response);
    };
    const moveStageIfNeeded = async (opportunity: IOpportunity, stage?: string) => {
        if (!stage || stage === OpportunityStage.New) {
            return opportunity;
        }
        const response = await backendRequest<BackendOpportunityDto>(`/api/Opportunities/${opportunity.id}/stage`, {
            body: JSON.stringify(buildUpdateOpportunityStagePayload(stage)),
            method: "PUT",
        });
        return mapBackendOpportunity(response);
    };
    useEffect(() => {
        const handleWorkspaceUpdate = (event: Event) => {
            const mutations = (event as CustomEvent<Array<{
                entityId: string;
                entityType: string;
                operation: string;
                record?: unknown;
            }>>).detail;
            if (!Array.isArray(mutations)) {
                return;
            }
            for (const mutation of mutations) {
                if (mutation.entityType !== "opportunity") {
                    continue;
                }
                if (mutation.operation === "delete") {
                    dispatch(deleteOpportunityAction(mutation.entityId));
                    continue;
                }
                if ((mutation.operation === "create" || mutation.operation === "update") &&
                    mutation.record &&
                    typeof mutation.record === "object") {
                    const record = mutation.record as IOpportunity;
                    const exists = state.opportunities.some((opportunity) => opportunity.id === record.id);
                    dispatch(exists ? updateOpportunityAction(record) : addOpportunityAction(record));
                }
            }
        };
        window.addEventListener("mock-workspace-updated", handleWorkspaceUpdate);
        return () => {
            window.removeEventListener("mock-workspace-updated", handleWorkspaceUpdate);
        };
    }, [state.opportunities]);
    return (<OpportunityStateContext.Provider value={{
            ...(isAuthenticated ? state : { ...state, ...PROVIDER_REQUEST_IDLE }),
            opportunities: isAuthenticated ? state.opportunities : [],
        }}>
      <OpportunityActionContext.Provider value={{
            addOpportunity: async (payload) => {
                dispatch(opportunityPendingAction());
                try {
                    let nextOpportunity = mapBackendOpportunity(await backendRequest<BackendOpportunityDto>("/api/Opportunities", {
                        body: JSON.stringify(buildCreateOpportunityPayload(payload)),
                        method: "POST",
                    }));
                    nextOpportunity = await assignIfNeeded(nextOpportunity, payload.ownerId);
                    nextOpportunity = await moveStageIfNeeded(nextOpportunity, String(payload.stage));
                    dispatch(addOpportunityAction(nextOpportunity));
                    return nextOpportunity;
                }
                catch (error) {
                    dispatch(opportunityErrorAction());
                    throw error;
                }
            },
            deleteOpportunity: async (id) => {
                dispatch(opportunityPendingAction());
                try {
                    await backendRequest<void>(`/api/Opportunities/${id}`, {
                        method: "DELETE",
                    });
                    dispatch(deleteOpportunityAction(id));
                }
                catch (error) {
                    dispatch(opportunityErrorAction());
                    throw error;
                }
            },
            updateOpportunity: async (id, payload) => {
                const existing = state.opportunities.find((item) => item.id === id);
                if (!existing) {
                    return undefined;
                }
                const merged = { ...existing, ...payload };
                dispatch(opportunityPendingAction());
                try {
                    let nextOpportunity = mapBackendOpportunity(await backendRequest<BackendOpportunityDto>(`/api/Opportunities/${id}`, {
                        body: JSON.stringify(buildUpdateOpportunityPayload(merged)),
                        method: "PUT",
                    }));
                    if (payload.ownerId && payload.ownerId !== existing.ownerId) {
                        nextOpportunity = await assignIfNeeded(nextOpportunity, payload.ownerId);
                    }
                    if (payload.stage && payload.stage !== existing.stage) {
                        nextOpportunity = await moveStageIfNeeded(nextOpportunity, String(payload.stage));
                    }
                    dispatch(updateOpportunityAction(nextOpportunity));
                    return nextOpportunity;
                }
                catch (error) {
                    dispatch(opportunityErrorAction());
                    throw error;
                }
            },
        }}>
        {children}
      </OpportunityActionContext.Provider>
    </OpportunityStateContext.Provider>);
};
