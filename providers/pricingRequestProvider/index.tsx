"use client";
import { useContext, useEffect, useMemo, useReducer } from "react";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole } from "@/lib/auth/roles";
import { type BackendPagedResult, type BackendPricingRequestDto, backendRequest, buildAssignPricingRequestPayload, buildCreatePricingRequestPayload, buildUpdatePricingRequestPayload, coerceItems, mapBackendPricingRequest, } from "@/lib/client/backend-api";
import { clearSessionDraft } from "@/lib/client/session-drafts";
import { useAuthState } from "@/providers/authProvider";
import { initialPricingRequests } from "@/providers/domainSeeds";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import type { IPricingRequest } from "@/providers/salesTypes";
import { addPricingRequestAction, deletePricingRequestAction, pricingRequestErrorAction, pricingRequestPendingAction, setPricingRequestsAction, updatePricingRequestAction, } from "./actions";
import { INITIAL_STATE, PricingRequestActionContext, PricingRequestStateContext, } from "./context";
import { PricingRequestReducer } from "./reducers";
const PRICING_REQUESTS_SESSION_KEY = "dashboard.pricing-requests.session";
export const usePricingRequestState = () => {
    const context = useContext(PricingRequestStateContext);
    if (context === undefined) {
        throw new Error("usePricingRequestState must be used within PricingRequestProvider.");
    }
    return context;
};
export const usePricingRequestActions = () => {
    const context = useContext(PricingRequestActionContext);
    if (context === undefined) {
        throw new Error("usePricingRequestActions must be used within PricingRequestProvider.");
    }
    return context;
};
export const PricingRequestProvider = ({ children, }: Readonly<{
    children: React.ReactNode;
}>) => {
    const { isAuthenticated, user } = useAuthState();
    const { opportunities } = useOpportunityState();
    const [state, dispatch] = useReducer(PricingRequestReducer, undefined, () => ({
        ...INITIAL_STATE,
        pricingRequests: [],
    }));
    const isDemoMode = Boolean(user?.isMockSession);
    const role = getPrimaryUserRole(user?.roles);
    const isClientScoped = isClientScopedUser(user?.clientIds);
    useEffect(() => {
        clearSessionDraft(PRICING_REQUESTS_SESSION_KEY);
    }, []);
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }
        let isActive = true;
        if (isDemoMode) {
            Promise.resolve().then(() => {
                if (!isActive) {
                    return;
                }
                dispatch(pricingRequestPendingAction());
                if (state.pricingRequests.length === 0) {
                    dispatch(setPricingRequestsAction(initialPricingRequests()));
                }
            });
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
                let next = state.pricingRequests;
                for (const mutation of mutations) {
                    if (mutation.entityType !== "pricing_request") {
                        continue;
                    }
                    if (mutation.operation === "delete") {
                        next = next.filter((item) => item.id !== mutation.entityId);
                        continue;
                    }
                    if ((mutation.operation === "create" || mutation.operation === "update") &&
                        mutation.record &&
                        typeof mutation.record === "object") {
                        const record = mutation.record as IPricingRequest;
                        const exists = next.some((item) => item.id === record.id);
                        next = exists
                            ? next.map((item) => (item.id === record.id ? record : item))
                            : [...next, record];
                    }
                }
                dispatch(setPricingRequestsAction(next));
            };
            window.addEventListener("mock-workspace-updated", handleWorkspaceUpdate);
            return () => {
                isActive = false;
                window.removeEventListener("mock-workspace-updated", handleWorkspaceUpdate);
            };
        }
        const loadPricingRequests = async () => {
            dispatch(pricingRequestPendingAction());
            try {
                const payload = await backendRequest<BackendPagedResult<BackendPricingRequestDto> | BackendPricingRequestDto[]>(role === "SalesRep"
                    ? "/api/pricingrequests/my-requests?pageNumber=1&pageSize=100"
                    : "/api/PricingRequests?pageNumber=1&pageSize=100");
                if (!isActive) {
                    return;
                }
                dispatch(setPricingRequestsAction(coerceItems(payload).map(mapBackendPricingRequest)));
            }
            catch (error) {
                console.error(error);
                if (isActive) {
                    dispatch(pricingRequestErrorAction());
                }
            }
        };
        void loadPricingRequests();
        return () => {
            isActive = false;
        };
    }, [isAuthenticated, isDemoMode, role, state.pricingRequests]);
    const replacePricingRequest = (request: IPricingRequest) => {
        const exists = state.pricingRequests.some((item) => item.id === request.id);
        dispatch(exists ? updatePricingRequestAction(request) : addPricingRequestAction(request));
    };
    const visiblePricingRequests = useMemo(() => {
        if (!isClientScoped) {
            return state.pricingRequests;
        }
        const clientOpportunityIds = new Set(opportunities
            .filter((opportunity) => user?.clientIds?.includes(opportunity.clientId))
            .map((opportunity) => opportunity.id));
        return state.pricingRequests.filter((request) => clientOpportunityIds.has(request.opportunityId));
    }, [isClientScoped, opportunities, state.pricingRequests, user?.clientIds]);
    return (<PricingRequestStateContext.Provider value={{
            ...(isAuthenticated ? state : { ...state, ...PROVIDER_REQUEST_IDLE }),
            pricingRequests: isAuthenticated ? visiblePricingRequests : [],
        }}>
      <PricingRequestActionContext.Provider value={{
            addPricingRequest: async (payload) => {
                dispatch(pricingRequestPendingAction());
                try {
                    if (isDemoMode) {
                        replacePricingRequest(payload);
                        return payload;
                    }
                    const request = mapBackendPricingRequest(await backendRequest<BackendPricingRequestDto>("/api/PricingRequests", {
                        body: JSON.stringify(buildCreatePricingRequestPayload(payload)),
                        method: "POST",
                    }));
                    replacePricingRequest(request);
                    return request;
                }
                catch (error) {
                    dispatch(pricingRequestErrorAction());
                    throw error;
                }
            },
            assignPricingRequest: async (id, userId) => {
                const existing = state.pricingRequests.find((item) => item.id === id);
                if (!existing) {
                    return undefined;
                }
                dispatch(pricingRequestPendingAction());
                try {
                    if (isDemoMode) {
                        const request = {
                            ...existing,
                            assignedToId: userId,
                        };
                        replacePricingRequest(request);
                        return request;
                    }
                    const request = mapBackendPricingRequest(await backendRequest<BackendPricingRequestDto>(`/api/PricingRequests/${id}/assign`, {
                        body: JSON.stringify(buildAssignPricingRequestPayload(userId)),
                        method: "POST",
                    }));
                    replacePricingRequest(request);
                    return request;
                }
                catch (error) {
                    dispatch(pricingRequestErrorAction());
                    throw error;
                }
            },
            completePricingRequest: async (id) => {
                const existing = state.pricingRequests.find((item) => item.id === id);
                if (!existing) {
                    return undefined;
                }
                dispatch(pricingRequestPendingAction());
                try {
                    if (isDemoMode) {
                        const request = {
                            ...existing,
                            completedDate: new Date().toISOString().split("T")[0],
                            status: "Completed",
                        };
                        replacePricingRequest(request);
                        return request;
                    }
                    const request = mapBackendPricingRequest(await backendRequest<BackendPricingRequestDto>(`/api/PricingRequests/${id}/complete`, {
                        method: "PUT",
                    }));
                    replacePricingRequest(request);
                    return request;
                }
                catch (error) {
                    dispatch(pricingRequestErrorAction());
                    throw error;
                }
            },
            deletePricingRequest: async (id) => {
                dispatch(pricingRequestPendingAction());
                try {
                    if (!isDemoMode) {
                        await backendRequest<void>(`/api/PricingRequests/${id}`, {
                            method: "DELETE",
                        });
                    }
                    dispatch(deletePricingRequestAction(id));
                }
                catch (error) {
                    dispatch(pricingRequestErrorAction());
                    throw error;
                }
            },
            updatePricingRequest: async (id, payload) => {
                const existing = state.pricingRequests.find((item) => item.id === id);
                if (!existing) {
                    return undefined;
                }
                const nextRequest = { ...existing, ...payload };
                dispatch(pricingRequestPendingAction());
                try {
                    if (isDemoMode) {
                        replacePricingRequest(nextRequest);
                        return nextRequest;
                    }
                    let mappedRequest = mapBackendPricingRequest(await backendRequest<BackendPricingRequestDto>(`/api/PricingRequests/${id}`, {
                        body: JSON.stringify(buildUpdatePricingRequestPayload(nextRequest)),
                        method: "PUT",
                    }));
                    if (payload.assignedToId && payload.assignedToId !== existing.assignedToId) {
                        mappedRequest = mapBackendPricingRequest(await backendRequest<BackendPricingRequestDto>(`/api/PricingRequests/${id}/assign`, {
                            body: JSON.stringify(buildAssignPricingRequestPayload(payload.assignedToId)),
                            method: "POST",
                        }));
                    }
                    replacePricingRequest(mappedRequest);
                    return mappedRequest;
                }
                catch (error) {
                    dispatch(pricingRequestErrorAction());
                    throw error;
                }
            },
        }}>
        {children}
      </PricingRequestActionContext.Provider>
    </PricingRequestStateContext.Provider>);
};
