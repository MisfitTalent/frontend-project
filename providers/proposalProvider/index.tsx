"use client";
import { useCallback, useContext, useEffect, useReducer } from "react";
import { type BackendPagedResult, type BackendProposalDto, backendRequest, buildCreateProposalPayload, buildProposalLineItemPayload, buildUpdateProposalPayload, coerceItems, mapBackendProposal, } from "@/lib/client/backend-api";
import { useAuthState } from "@/providers/authProvider";
import { initialProposals } from "@/providers/domainSeeds";
import { PROVIDER_REQUEST_IDLE } from "@/providers/provider-state";
import { ProposalStatus, type ILineItem, type IProposal } from "@/providers/salesTypes";
import { addProposalAction, deleteProposalAction, proposalErrorAction, proposalPendingAction, setProposalsAction, updateProposalAction, } from "./actions";
import { INITIAL_STATE, ProposalActionContext, ProposalStateContext } from "./context";
import { ProposalReducer } from "./reducers";
export const useProposalState = () => {
    const context = useContext(ProposalStateContext);
    if (context === undefined) {
        throw new Error("useProposalState must be used within ProposalProvider.");
    }
    return context;
};
export const useProposalActions = () => {
    const context = useContext(ProposalActionContext);
    if (context === undefined) {
        throw new Error("useProposalActions must be used within ProposalProvider.");
    }
    return context;
};
const withDecisionNote = (proposal: IProposal, status: ProposalStatus | string, decisionNote?: string) => {
    if (!decisionNote?.trim()) {
        return proposal;
    }
    const label = status === ProposalStatus.Rejected ? "Rejection reason" : "Decision note";
    const nextDescription = [proposal.description?.trim(), `${label}: ${decisionNote.trim()}`]
        .filter(Boolean)
        .join("\n\n");
    return {
        ...proposal,
        description: nextDescription,
    };
};
const syncLineItems = async (proposalId: string, previousLineItems: ILineItem[] = [], nextLineItems: ILineItem[] = []) => {
    const previousIds = new Set(previousLineItems.map((item) => item.id).filter((id): id is string => Boolean(id)));
    const nextIds = new Set(nextLineItems.map((item) => item.id).filter((id): id is string => Boolean(id)));
    for (const lineItem of nextLineItems) {
        if (lineItem.id && previousIds.has(lineItem.id)) {
            await backendRequest(`/api/Proposals/${proposalId}/line-items/${lineItem.id}`, {
                body: JSON.stringify(buildProposalLineItemPayload(lineItem)),
                method: "PUT",
            });
            continue;
        }
        await backendRequest(`/api/Proposals/${proposalId}/line-items`, {
            body: JSON.stringify(buildProposalLineItemPayload(lineItem)),
            method: "POST",
        });
    }
    for (const lineItem of previousLineItems) {
        if (lineItem.id && !nextIds.has(lineItem.id)) {
            await backendRequest<void>(`/api/Proposals/${proposalId}/line-items/${lineItem.id}`, {
                method: "DELETE",
            });
        }
    }
};
export const ProposalProvider = ({ children, }: Readonly<{
    children: React.ReactNode;
}>) => {
    const { isAuthenticated, user } = useAuthState();
    const [state, dispatch] = useReducer(ProposalReducer, INITIAL_STATE);
    const isDemoMode = Boolean(user?.isMockSession);
    const loadProposals = useCallback(async () => {
        dispatch(proposalPendingAction());
        const payload = await backendRequest<BackendPagedResult<BackendProposalDto> | BackendProposalDto[]>("/api/Proposals?pageNumber=1&pageSize=100");
        dispatch(setProposalsAction(coerceItems(payload).map(mapBackendProposal)));
    }, []);
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }
        let isActive = true;
        if (isDemoMode) {
            const timer = window.setTimeout(() => {
                void loadProposals().catch((error) => {
                    console.error(error);
                    if (isActive) {
                        dispatch(setProposalsAction(initialProposals()));
                    }
                });
            }, 0);
            const handleWorkspaceUpdate = () => {
                void loadProposals().catch((error) => {
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
        void backendRequest<BackendPagedResult<BackendProposalDto> | BackendProposalDto[]>("/api/Proposals?pageNumber=1&pageSize=100")
            .then((payload) => {
            if (!isActive) {
                return;
            }
            dispatch(setProposalsAction(coerceItems(payload).map(mapBackendProposal)));
        })
            .catch((error) => {
            console.error(error);
            if (isActive) {
                dispatch(proposalErrorAction());
            }
        });
        return () => {
            isActive = false;
        };
    }, [dispatch, isAuthenticated, isDemoMode, loadProposals]);
    const replaceProposal = (proposal: IProposal) => {
        const exists = state.proposals.some((item) => item.id === proposal.id);
        dispatch(exists
            ? updateProposalAction(proposal)
            : addProposalAction(proposal));
    };
    const refreshProposal = async (id: string) => {
        const detailedProposal = mapBackendProposal(await backendRequest<BackendProposalDto>(`/api/Proposals/${id}`));
        replaceProposal(detailedProposal);
        return detailedProposal;
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
                if (mutation.entityType !== "proposal") {
                    continue;
                }
                if (mutation.operation === "delete") {
                    dispatch(deleteProposalAction(mutation.entityId));
                    continue;
                }
                if ((mutation.operation === "create" || mutation.operation === "update") &&
                    mutation.record &&
                    typeof mutation.record === "object") {
                    const record = mutation.record as IProposal;
                    const exists = state.proposals.some((proposal) => proposal.id === record.id);
                    dispatch(exists ? updateProposalAction(record) : addProposalAction(record));
                }
            }
        };
        window.addEventListener("mock-workspace-updated", handleWorkspaceUpdate);
        return () => {
            window.removeEventListener("mock-workspace-updated", handleWorkspaceUpdate);
        };
    }, [state.proposals]);
    return (<ProposalStateContext.Provider value={{
            ...(isAuthenticated ? state : { ...state, ...PROVIDER_REQUEST_IDLE }),
            proposals: isAuthenticated ? state.proposals : [],
        }}>
      <ProposalActionContext.Provider value={{
            addProposal: async (payload) => {
                dispatch(proposalPendingAction());
                try {
                    const proposal = mapBackendProposal(await backendRequest<BackendProposalDto>("/api/Proposals", {
                        body: JSON.stringify(buildCreateProposalPayload(payload)),
                        method: "POST",
                    }));
                    dispatch(addProposalAction(proposal));
                    return proposal;
                }
                catch (error) {
                    dispatch(proposalErrorAction());
                    throw error;
                }
            },
            deleteProposal: async (id) => {
                dispatch(proposalPendingAction());
                try {
                    await backendRequest<void>(`/api/Proposals/${id}`, {
                        method: "DELETE",
                    });
                    dispatch(deleteProposalAction(id));
                }
                catch (error) {
                    dispatch(proposalErrorAction());
                    throw error;
                }
            },
            transitionProposal: async (id, status, decisionNote) => {
                const existing = state.proposals.find((item) => item.id === id);
                if (!existing) {
                    return undefined;
                }
                const preparedProposal = withDecisionNote(existing, status, decisionNote);
                dispatch(proposalPendingAction());
                try {
                    if (preparedProposal.description !== existing.description) {
                        await backendRequest<BackendProposalDto>(`/api/Proposals/${id}`, {
                            body: JSON.stringify(buildUpdateProposalPayload(preparedProposal)),
                            method: "PUT",
                        });
                    }
                    let transitionPath: string | null = null;
                    if (status === ProposalStatus.Submitted) {
                        transitionPath = "submit";
                    }
                    else if (status === ProposalStatus.Approved) {
                        transitionPath = "approve";
                    }
                    else if (status === ProposalStatus.Rejected) {
                        transitionPath = "reject";
                    }
                    if (!transitionPath) {
                        return refreshProposal(id);
                    }
                    await backendRequest<BackendProposalDto>(`/api/Proposals/${id}/${transitionPath}`, {
                        body: status === ProposalStatus.Rejected
                            ? JSON.stringify({ reason: decisionNote?.trim() || "Rejected from dashboard." })
                            : undefined,
                        method: "PUT",
                    });
                    return refreshProposal(id);
                }
                catch (error) {
                    dispatch(proposalErrorAction());
                    throw error;
                }
            },
            updateProposal: async (id, payload) => {
                const existing = state.proposals.find((item) => item.id === id);
                if (!existing) {
                    return undefined;
                }
                const nextProposal = { ...existing, ...payload };
                dispatch(proposalPendingAction());
                try {
                    await backendRequest<BackendProposalDto>(`/api/Proposals/${id}`, {
                        body: JSON.stringify(buildUpdateProposalPayload(nextProposal)),
                        method: "PUT",
                    });
                    await syncLineItems(id, existing.lineItems, nextProposal.lineItems);
                    return refreshProposal(id);
                }
                catch (error) {
                    dispatch(proposalErrorAction());
                    throw error;
                }
            },
        }}>
        {children}
      </ProposalActionContext.Provider>
    </ProposalStateContext.Provider>);
};
