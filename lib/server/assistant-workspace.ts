import "server-only";

import type { IMockUser } from "@/app/api/Auth/mock-users";
import { type IDocumentItem, type INoteItem } from "@/providers/domainSeeds";
import type { IPricingRequest, ISalesData, UserRole } from "@/providers/salesTypes";
import { getUserRoleLabel, normalizeUserRole } from "@/lib/auth/roles";
import { getMockWorkspaceSnapshot } from "@/lib/server/mock-workspace-store";

export interface IAssistantWorkspace {
  documents: IDocumentItem[];
  isClientScoped: boolean;
  notes: INoteItem[];
  pricingRequests: IPricingRequest[];
  role: UserRole;
  salesData: ISalesData;
  scopeLabel: string;
  tenantId: string;
  userDisplayName: string;
}

export const getAssistantWorkspaceForUser = (
  user: IMockUser,
): IAssistantWorkspace => {
  const role: UserRole = normalizeUserRole(user.role);
  const workspace = getMockWorkspaceSnapshot(user.tenantId);
  const isClientScoped = (user.clientIds?.length ?? 0) > 0;

  if (!isClientScoped) {
    return {
      documents: workspace.documents,
      isClientScoped: false,
      notes: workspace.notes,
      pricingRequests: workspace.pricingRequests,
      role,
      salesData: workspace.salesData,
      scopeLabel: `${getUserRoleLabel(role)} tenant scope`,
      tenantId: user.tenantId,
      userDisplayName: `${user.firstName} ${user.lastName}`.trim(),
    };
  }

  const allowedClientIds = new Set(user.clientIds ?? []);
  const scopedClients = workspace.salesData.clients.filter((client) => allowedClientIds.has(client.id));
  const scopedContacts = workspace.salesData.contacts.filter((contact) =>
    allowedClientIds.has(contact.clientId),
  );
  const scopedOpportunities = workspace.salesData.opportunities.filter((opportunity) =>
    allowedClientIds.has(opportunity.clientId),
  );
  const scopedProposals = workspace.salesData.proposals.filter((proposal) =>
    allowedClientIds.has(proposal.clientId),
  );
  const scopedContracts = workspace.salesData.contracts.filter((contract) =>
    allowedClientIds.has(contract.clientId),
  );
  const scopedContractIds = new Set(scopedContracts.map((contract) => contract.id));
  const scopedRenewals = workspace.salesData.renewals.filter((renewal) =>
    scopedContractIds.has(renewal.contractId),
  );
  const scopedOpportunityIds = new Set(scopedOpportunities.map((opportunity) => opportunity.id));
  const scopedProposalIds = new Set(scopedProposals.map((proposal) => proposal.id));
  const scopedActivities = workspace.salesData.activities.filter(
    (activity) =>
      scopedOpportunityIds.has(activity.relatedToId) || scopedProposalIds.has(activity.relatedToId),
  );
  const scopedRepresentativeIds = new Set(
    [
      ...scopedOpportunities.map((opportunity) => opportunity.ownerId).filter(Boolean),
      ...scopedActivities.map((activity) => activity.assignedToId).filter(Boolean),
    ] as string[],
  );
  const scopedTeamMembers = workspace.salesData.teamMembers.filter((member) =>
    scopedRepresentativeIds.has(member.id),
  );
  const scopedDocuments = workspace.documents.filter(
    (document) => !document.clientId || allowedClientIds.has(document.clientId),
  );
  const scopedNotes = workspace.notes.filter(
    (note) =>
      note.category !== "Internal" &&
      (!note.clientId || allowedClientIds.has(note.clientId)),
  );
  const scopedPricingRequests = workspace.pricingRequests.filter((request) =>
    scopedOpportunityIds.has(request.opportunityId),
  );
  const scopedSalesData: ISalesData = {
    activities: scopedActivities,
    automationFeed: [],
    clients: scopedClients,
    contacts: scopedContacts,
    contracts: scopedContracts,
    opportunities: scopedOpportunities,
    pricingRequests: scopedPricingRequests,
    proposals: scopedProposals,
    renewals: scopedRenewals,
    teamMembers: scopedTeamMembers,
  };

  return {
    documents: scopedDocuments,
    isClientScoped: true,
    notes: scopedNotes,
    pricingRequests: scopedPricingRequests,
    role,
    salesData: scopedSalesData,
    scopeLabel: "Client account scope",
    tenantId: user.tenantId,
    userDisplayName: `${user.firstName} ${user.lastName}`.trim(),
  };
};
