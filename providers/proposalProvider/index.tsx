"use client";

import { useCallback, useContext, useEffect, useState } from "react";

import {
  type BackendPagedResult,
  type BackendProposalDto,
  backendRequest,
  buildCreateProposalPayload,
  buildProposalLineItemPayload,
  buildUpdateProposalPayload,
  coerceItems,
  getSessionToken,
  isMockSessionToken,
  mapBackendProposal,
} from "@/lib/client/backend-api";
import { useAuthState } from "@/providers/authProvider";
import { initialProposals } from "@/providers/domainSeeds";
import { ProposalStatus, type ILineItem, type IProposal } from "@/providers/salesTypes";
import { ProposalActionContext, ProposalStateContext } from "./context";

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

const withDecisionNote = (
  proposal: IProposal,
  status: ProposalStatus | string,
  decisionNote?: string,
) => {
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

const syncLineItems = async (
  proposalId: string,
  previousLineItems: ILineItem[] = [],
  nextLineItems: ILineItem[] = [],
) => {
  const previousIds = new Set(
    previousLineItems.map((item) => item.id).filter((id): id is string => Boolean(id)),
  );
  const nextIds = new Set(
    nextLineItems.map((item) => item.id).filter((id): id is string => Boolean(id)),
  );

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
      await backendRequest<void>(
        `/api/Proposals/${proposalId}/line-items/${lineItem.id}`,
        {
          method: "DELETE",
        },
      );
    }
  }
};

export default function ProposalProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated } = useAuthState();
  const [proposals, setProposals] = useState<IProposal[]>([]);
  const isDemoMode = isMockSessionToken(getSessionToken());

  const loadProposals = useCallback(async () => {
    const payload = await backendRequest<BackendPagedResult<BackendProposalDto> | BackendProposalDto[]>(
      "/api/Proposals?pageNumber=1&pageSize=100",
    );

    setProposals(coerceItems(payload).map(mapBackendProposal));
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
            setProposals(initialProposals());
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

    void backendRequest<BackendPagedResult<BackendProposalDto> | BackendProposalDto[]>(
      "/api/Proposals?pageNumber=1&pageSize=100",
    )
      .then((payload) => {
        if (!isActive) {
          return;
        }

        setProposals(coerceItems(payload).map(mapBackendProposal));
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, isDemoMode, loadProposals]);

  const replaceProposal = (proposal: IProposal) => {
    setProposals((current) => {
      const exists = current.some((item) => item.id === proposal.id);

      return exists
        ? current.map((item) => (item.id === proposal.id ? proposal : item))
        : [...current, proposal];
    });
  };

  const refreshProposal = async (id: string) => {
    if (isDemoMode) {
      const detailedProposal = mapBackendProposal(
        await backendRequest<BackendProposalDto>(`/api/Proposals/${id}`),
      );

      replaceProposal(detailedProposal);

      return detailedProposal;
    }

    const detailedProposal = mapBackendProposal(
      await backendRequest<BackendProposalDto>(`/api/Proposals/${id}`),
    );

    replaceProposal(detailedProposal);

    return detailedProposal;
  };

  return (
    <ProposalStateContext.Provider value={{ proposals: isAuthenticated ? proposals : [] }}>
      <ProposalActionContext.Provider
        value={{
          addProposal: async (payload) => {
            if (isDemoMode) {
              const proposal = mapBackendProposal(
                await backendRequest<BackendProposalDto>("/api/Proposals", {
                  body: JSON.stringify(buildCreateProposalPayload(payload)),
                  method: "POST",
                }),
              );

              replaceProposal(proposal);
              return proposal;
            }

            const proposal = mapBackendProposal(
              await backendRequest<BackendProposalDto>("/api/Proposals", {
                body: JSON.stringify(buildCreateProposalPayload(payload)),
                method: "POST",
              }),
            );

            replaceProposal(proposal);

            return proposal;
          },
          deleteProposal: async (id) => {
            if (isDemoMode) {
              await backendRequest<void>(`/api/Proposals/${id}`, {
                method: "DELETE",
              });
              setProposals((current) => current.filter((item) => item.id !== id));
              return;
            }

            await backendRequest<void>(`/api/Proposals/${id}`, {
              method: "DELETE",
            });

            setProposals((current) => current.filter((item) => item.id !== id));
          },
          transitionProposal: async (id, status, decisionNote) => {
            const existing = proposals.find((item) => item.id === id);

            if (!existing) {
              return undefined;
            }

            const preparedProposal = withDecisionNote(existing, status, decisionNote);

            if (isDemoMode) {
              if (preparedProposal.description !== existing.description) {
                await backendRequest<BackendProposalDto>(`/api/Proposals/${id}`, {
                  body: JSON.stringify(buildUpdateProposalPayload(preparedProposal)),
                  method: "PUT",
                });
              }

              let transitionPath: string | null = null;

              if (status === ProposalStatus.Submitted) {
                transitionPath = "submit";
              } else if (status === ProposalStatus.Approved) {
                transitionPath = "approve";
              } else if (status === ProposalStatus.Rejected) {
                transitionPath = "reject";
              }

              if (!transitionPath) {
                return refreshProposal(id);
              }

              await backendRequest<BackendProposalDto>(`/api/Proposals/${id}/${transitionPath}`, {
                body:
                  status === ProposalStatus.Rejected
                    ? JSON.stringify({ reason: decisionNote?.trim() || "Rejected from dashboard." })
                    : undefined,
                method: "PUT",
              });

              return refreshProposal(id);
            }

            if (preparedProposal.description !== existing.description) {
              await backendRequest<BackendProposalDto>(`/api/Proposals/${id}`, {
                body: JSON.stringify(buildUpdateProposalPayload(preparedProposal)),
                method: "PUT",
              });
            }

            let transitionPath: string | null = null;

            if (status === ProposalStatus.Submitted) {
              transitionPath = "submit";
            } else if (status === ProposalStatus.Approved) {
              transitionPath = "approve";
            } else if (status === ProposalStatus.Rejected) {
              transitionPath = "reject";
            }

            if (!transitionPath) {
              return refreshProposal(id);
            }

            await backendRequest<BackendProposalDto>(`/api/Proposals/${id}/${transitionPath}`, {
              body:
                status === ProposalStatus.Rejected
                  ? JSON.stringify({ reason: decisionNote?.trim() || "Rejected from dashboard." })
                  : undefined,
              method: "PUT",
            });

            return refreshProposal(id);
          },
          updateProposal: async (id, payload) => {
            const existing = proposals.find((item) => item.id === id);

            if (!existing) {
              return undefined;
            }

            const nextProposal = { ...existing, ...payload };

            if (isDemoMode) {
              await backendRequest<BackendProposalDto>(`/api/Proposals/${id}`, {
                body: JSON.stringify(buildUpdateProposalPayload(nextProposal)),
                method: "PUT",
              });

              await syncLineItems(id, existing.lineItems, nextProposal.lineItems);

              return refreshProposal(id);
            }

            await backendRequest<BackendProposalDto>(`/api/Proposals/${id}`, {
              body: JSON.stringify(buildUpdateProposalPayload(nextProposal)),
              method: "PUT",
            });

            await syncLineItems(id, existing.lineItems, nextProposal.lineItems);

            return refreshProposal(id);
          },
        }}
      >
        {children}
      </ProposalActionContext.Provider>
    </ProposalStateContext.Provider>
  );
}
