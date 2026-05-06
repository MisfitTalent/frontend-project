import "server-only";

import type { IMockUser } from "@/app/api/Auth/mock-users";
import { type IDocumentItem, type INoteItem } from "@/providers/domainSeeds";
import type {
  IAutomationEvent,
  IPricingRequest,
  ISalesData,
  UserRole,
} from "@/providers/salesTypes";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getUserRoleLabel, normalizeUserRole } from "@/lib/auth/roles";
import {
  isMockAssistantSessionToken,
  loadAssistantLiveWorkspace,
} from "@/lib/server/assistant-backend";
import { getMockWorkspaceSnapshot } from "@/lib/server/mock-workspace-store";
import {
  listServiceRequests,
  type ServiceRequestRecord,
} from "@/lib/server/service-request-store";

export interface IAssistantWorkspace {
  clientIds?: string[] | null;
  documents: IDocumentItem[];
  isLiveBackend?: boolean;
  userEmail?: string;
  userId?: string;
  notes: INoteItem[];
  pricingRequests: IPricingRequest[];
  role: UserRole;
  salesData: ISalesData;
  sessionToken?: string;
  serviceRequests: ServiceRequestRecord[];
  scopeLabel: string;
  tenantId: string;
  userDisplayName: string;
}

const getScopeLabel = (role: UserRole, clientIds?: string[] | null) => {
  if (isClientScopedUser(clientIds)) {
    return "Client workspace scope";
  }

  if (role === "SalesRep") {
    return "Assigned sales workspace scope";
  }

  return `${getUserRoleLabel(role)} tenant scope`;
};

const filterAutomationFeed = (
  automationFeed: IAutomationEvent[],
  role: UserRole,
  clientIds?: string[] | null,
) => (role === "SalesRep" || isClientScopedUser(clientIds) ? [] : automationFeed);

const buildScopedSalesData = (
  salesData: ISalesData,
  role: UserRole,
  user: IMockUser,
): ISalesData => {
  if (role !== "SalesRep" && !isClientScopedUser(user.clientIds)) {
    return salesData;
  }

  const scopedClientIds = new Set(
    isClientScopedUser(user.clientIds)
      ? user.clientIds
      : salesData.opportunities
          .filter((opportunity) => opportunity.ownerId === user.id)
          .map((opportunity) => opportunity.clientId),
  );

  const scopedOpportunities = salesData.opportunities.filter((opportunity) =>
    isClientScopedUser(user.clientIds)
      ? scopedClientIds.has(opportunity.clientId)
      : opportunity.ownerId === user.id,
  );
  const scopedOpportunityIds = new Set(scopedOpportunities.map((opportunity) => opportunity.id));
  const scopedClients = salesData.clients.filter((client) => scopedClientIds.has(client.id));
  const scopedContacts = salesData.contacts.filter((contact) => scopedClientIds.has(contact.clientId));
  const scopedProposals = salesData.proposals.filter(
    (proposal) =>
      scopedOpportunityIds.has(proposal.opportunityId) || scopedClientIds.has(proposal.clientId),
  );
  const scopedProposalIds = new Set(scopedProposals.map((proposal) => proposal.id));
  const scopedContracts = salesData.contracts.filter(
    (contract) =>
      scopedClientIds.has(contract.clientId) ||
      (contract.opportunityId ? scopedOpportunityIds.has(contract.opportunityId) : false) ||
      (contract.proposalId ? scopedProposalIds.has(contract.proposalId) : false),
  );
  const scopedContractIds = new Set(scopedContracts.map((contract) => contract.id));
  const scopedClientNames = new Set(scopedClients.map((client) => client.name.trim().toLowerCase()));
  const scopedRenewals = salesData.renewals.filter(
    (renewal) =>
      scopedContractIds.has(renewal.contractId) ||
      (renewal.renewalOpportunityId ? scopedOpportunityIds.has(renewal.renewalOpportunityId) : false) ||
      (renewal.clientName ? scopedClientNames.has(renewal.clientName.trim().toLowerCase()) : false),
  );
  const scopedActivities = salesData.activities.filter((activity) =>
    role === "SalesRep" && !isClientScopedUser(user.clientIds)
      ? activity.assignedToId === user.id || scopedOpportunityIds.has(activity.relatedToId)
      : scopedOpportunityIds.has(activity.relatedToId),
  );
  const scopedTeamMemberIds = new Set<string>(
    [
      user.id,
      ...scopedOpportunities.map((opportunity) => opportunity.ownerId).filter(Boolean),
      ...scopedActivities.map((activity) => activity.assignedToId).filter(Boolean),
    ] as string[],
  );
  const scopedTeamMembers = salesData.teamMembers.filter((member) =>
    scopedTeamMemberIds.has(member.id),
  );

  return {
    activities: scopedActivities,
    automationFeed: filterAutomationFeed(salesData.automationFeed, role, user.clientIds),
    clients: scopedClients,
    contacts: scopedContacts,
    contracts: scopedContracts,
    opportunities: scopedOpportunities,
    proposals: scopedProposals,
    renewals: scopedRenewals,
    teamMembers: scopedTeamMembers,
  };
};

const buildScopedPricingRequests = (
  pricingRequests: IPricingRequest[],
  scopedSalesData: ISalesData,
  role: UserRole,
  user: IMockUser,
) => {
  if (role !== "SalesRep" && !isClientScopedUser(user.clientIds)) {
    return pricingRequests;
  }

  const scopedOpportunityIds = new Set(scopedSalesData.opportunities.map((opportunity) => opportunity.id));

  return pricingRequests.filter((request) =>
    scopedOpportunityIds.has(request.opportunityId) ||
    request.assignedToId === user.id ||
    request.requestedById === user.id,
  );
};

const buildScopedNotes = (
  notes: INoteItem[],
  scopedSalesData: ISalesData,
  role: UserRole,
  user: IMockUser,
) => {
  if (role !== "SalesRep" && !isClientScopedUser(user.clientIds)) {
    return notes;
  }

  const scopedClientIds = new Set(scopedSalesData.clients.map((client) => client.id));

  return notes.filter(
    (note) =>
      (note.clientId ? scopedClientIds.has(note.clientId) : false) ||
      note.representativeId === user.id ||
      note.submittedBy === user.email,
  );
};

const buildScopedDocuments = (
  documents: IDocumentItem[],
  scopedSalesData: ISalesData,
  role: UserRole,
  user: IMockUser,
) => {
  if (role !== "SalesRep" && !isClientScopedUser(user.clientIds)) {
    return documents;
  }

  const scopedClientIds = new Set(scopedSalesData.clients.map((client) => client.id));
  return documents.filter((document) => (document.clientId ? scopedClientIds.has(document.clientId) : false));
};

export const getAssistantWorkspaceForUser = async (
  user: IMockUser,
  sessionToken?: string | null,
): Promise<IAssistantWorkspace> => {
  const role: UserRole = normalizeUserRole(user.role);
  const workspace =
    sessionToken && !isMockAssistantSessionToken(sessionToken)
      ? await loadAssistantLiveWorkspace(user, sessionToken)
      : getMockWorkspaceSnapshot(user.tenantId);
  const salesData = buildScopedSalesData(workspace.salesData, role, user);
  const documents = buildScopedDocuments(workspace.documents, salesData, role, user);
  const notes = buildScopedNotes(workspace.notes, salesData, role, user);
  const pricingRequests = buildScopedPricingRequests(workspace.pricingRequests, salesData, role, user);
  const serviceRequests = listServiceRequests(user);

  return {
    clientIds: user.clientIds ?? null,
    documents,
    notes,
    pricingRequests,
    role,
    salesData,
    sessionToken: sessionToken ?? undefined,
    serviceRequests,
    isLiveBackend: Boolean(sessionToken && !isMockAssistantSessionToken(sessionToken)),
    scopeLabel: getScopeLabel(role, user.clientIds),
    tenantId: user.tenantId,
    userDisplayName: `${user.firstName} ${user.lastName}`.trim(),
    userEmail: user.email,
    userId: user.id,
  };
};
