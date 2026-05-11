export const ASSISTANT_PANEL_DRAFT_KEY = "autosales:draft:assistant-panel";
export const ASSISTANT_PANEL_MESSAGES_KEY = "autosales:draft:assistant-panel:messages";
export const PRIORITY_ADVISOR_DRAFT_KEY = "autosales:draft:priority-advisor";
export const PRIORITY_ADVISOR_MESSAGES_KEY = "autosales:draft:priority-advisor:messages";

export const getScopedDraftKey = (
  key: string,
  scope?:
    | string
    | null
    | {
        tenantId?: string | null;
        userId?: string | null;
      },
) => {
  if (!scope) {
    return key;
  }

  if (typeof scope === "string") {
    return `${key}:${scope}`;
  }

  const parts = [scope.tenantId, scope.userId].filter(Boolean);

  return parts.length > 0 ? `${key}:${parts.join(":")}` : key;
};

export const getClientFormDraftKey = (clientId?: string | null) =>
  clientId
    ? `autosales:draft:client-form:edit:${clientId}`
    : "autosales:draft:client-form:new";

export const getOpportunityFormDraftKey = (opportunityId?: string | null) =>
  opportunityId
    ? `autosales:draft:opportunity-form:edit:${opportunityId}`
    : "autosales:draft:opportunity-form:new";

export const getProposalFormDraftKey = (proposalId?: string | null) =>
  proposalId
    ? `autosales:draft:proposal-form:edit:${proposalId}`
    : "autosales:draft:proposal-form:new";
