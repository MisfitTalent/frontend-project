export const ASSISTANT_PANEL_DRAFT_KEY = "autosales:draft:assistant-panel";
export const ASSISTANT_PANEL_MESSAGES_KEY = "autosales:draft:assistant-panel:messages";
export const PRIORITY_ADVISOR_DRAFT_KEY = "autosales:draft:priority-advisor";
export const PRIORITY_ADVISOR_MESSAGES_KEY = "autosales:draft:priority-advisor:messages";

type DraftScope = {
  tenantId?: string | null;
  userId?: string | null;
};

export const getScopedDraftKey = (
  baseKey: string,
  scope?: DraftScope | null,
) => {
  const tenantId = scope?.tenantId?.trim();
  const userId = scope?.userId?.trim();

  if (!tenantId || !userId) {
    return baseKey;
  }

  return `${baseKey}:${tenantId}:${userId}`;
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
