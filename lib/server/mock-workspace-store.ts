import "server-only";

import type { IMockUser } from "@/app/api/Auth/mock-users";
import {
  initialActivities,
  initialAutomationFeed,
  initialClients,
  initialContacts,
  initialContracts,
  initialDocuments,
  initialNotes,
  initialOpportunities,
  initialPricingRequests,
  initialProposals,
  initialRenewals,
  initialTeamMembers,
  type IDocumentItem,
  type INoteItem,
} from "@/providers/domainSeeds";
import { getBestOwner } from "@/providers/salesSelectors";
import {
  OpportunityStage,
  ProposalStatus,
  type IActivity,
  type IClient,
  type IContact,
  type IOpportunity,
  type IPricingRequest,
  type IProposal,
  type ISalesData,
  type ITeamMember,
} from "@/providers/salesTypes";

type MockWorkspaceState = {
  documents: IDocumentItem[];
  notes: INoteItem[];
  pricingRequests: IPricingRequest[];
  salesData: ISalesData;
};

declare global {
  // Keep one in-memory store across Next route bundles in the same Node process.
  // eslint-disable-next-line no-var
  var __mockWorkspaceStore__: Map<string, MockWorkspaceState> | undefined;
}

type CreateOpportunityInput = {
  clientId: string;
  contactId?: string;
  description?: string;
  estimatedValue: number;
  expectedCloseDate: string;
  ownerId?: string;
  probability?: number;
  source?: number;
  stage?: string;
  title: string;
};

type CreateClientInput = {
  billingAddress?: string;
  clientType?: number;
  companySize?: string;
  industry: string;
  name: string;
  taxNumber?: string;
  website?: string;
};

type CreateProposalInput = {
  currency?: string;
  description?: string;
  lineItems?: IProposal["lineItems"];
  opportunityId: string;
  title: string;
  validUntil: string;
};

type CreateActivityInput = Omit<IActivity, "id"> & {
  id?: string;
};

type CreatePricingRequestInput = Omit<IPricingRequest, "createdAt" | "id"> & {
  id?: string;
};

const workspaceStore =
  globalThis.__mockWorkspaceStore__ ?? new Map<string, MockWorkspaceState>();

globalThis.__mockWorkspaceStore__ = workspaceStore;

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const clone = <T,>(value: T): T => structuredClone(value);

const buildSeedWorkspace = (): MockWorkspaceState => ({
  documents: initialDocuments(),
  notes: initialNotes(),
  pricingRequests: initialPricingRequests(),
  salesData: {
    activities: initialActivities(),
    automationFeed: initialAutomationFeed(),
    clients: initialClients(),
    contacts: initialContacts(),
    contracts: initialContracts(),
    opportunities: initialOpportunities(),
    proposals: initialProposals(),
    renewals: initialRenewals(),
    teamMembers: initialTeamMembers(),
  },
});

const getWorkspaceState = (tenantId: string) => {
  const existing = workspaceStore.get(tenantId);

  if (existing) {
    return existing;
  }

  const next = buildSeedWorkspace();
  workspaceStore.set(tenantId, next);

  return next;
};

const normalizeDate = (value?: string | null) => {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }

  return value.split("T")[0];
};

const getDefaultOwner = (salesData: ISalesData, clientId: string, value: number) => {
  const client = salesData.clients.find((item) => item.id === clientId);

  return getBestOwner(salesData, value, client?.industry ?? "General");
};

const getLineItemsTotal = (lineItems: IProposal["lineItems"] = []) =>
  lineItems.reduce((sum, item) => {
    const quantity = Number(item.quantity ?? 0);
    const unitPrice = Number(item.unitPrice ?? 0);
    const discount = Number(item.discount ?? 0);
    const taxRate = Number(item.taxRate ?? 0);
    const subtotal = quantity * unitPrice * (1 - discount / 100);

    return sum + subtotal * (1 + taxRate / 100);
  }, 0);

export const getMockWorkspaceSnapshot = (tenantId: string): MockWorkspaceState =>
  clone(getWorkspaceState(tenantId));

export const listMockClients = (tenantId: string) =>
  clone(getWorkspaceState(tenantId).salesData.clients);

export const listMockContacts = (tenantId: string) =>
  clone(getWorkspaceState(tenantId).salesData.contacts);

export const createMockClient = (user: IMockUser, input: CreateClientInput) => {
  const workspace = getWorkspaceState(user.tenantId);
  const client: IClient = {
    billingAddress: input.billingAddress,
    clientType: input.clientType ?? 2,
    companySize: input.companySize,
    createdAt: new Date().toISOString(),
    id: createId("client"),
    industry: input.industry,
    isActive: true,
    name: input.name,
    taxNumber: input.taxNumber,
    website: input.website,
  };

  workspace.salesData.clients.push(client);
  workspace.salesData.automationFeed.unshift({
    createdAt: new Date().toISOString(),
    description: `${user.firstName} ${user.lastName}`.trim() + ` added ${client.name} as a client.`,
    id: createId("auto"),
    title: "Client created",
  });

  return clone(client);
};

export const updateMockClient = (
  tenantId: string,
  clientId: string,
  patch: Partial<IClient>,
) => {
  const workspace = getWorkspaceState(tenantId);
  const index = workspace.salesData.clients.findIndex((item) => item.id === clientId);

  if (index < 0) {
    return null;
  }

  workspace.salesData.clients[index] = {
    ...workspace.salesData.clients[index],
    ...patch,
  };

  return clone(workspace.salesData.clients[index]);
};

export const deleteMockClient = (tenantId: string, clientId: string) => {
  const workspace = getWorkspaceState(tenantId);
  workspace.salesData.clients = workspace.salesData.clients.filter((item) => item.id !== clientId);
  workspace.salesData.contacts = workspace.salesData.contacts.filter((item) => item.clientId !== clientId);
  workspace.salesData.opportunities = workspace.salesData.opportunities.filter((item) => item.clientId !== clientId);
  workspace.salesData.proposals = workspace.salesData.proposals.filter((item) => item.clientId !== clientId);
};

export const createMockContact = (user: IMockUser, input: Omit<IContact, "id">) => {
  const workspace = getWorkspaceState(user.tenantId);
  const contact: IContact = {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    id: createId("contact"),
  };

  workspace.salesData.contacts.push(contact);
  workspace.salesData.automationFeed.unshift({
    createdAt: new Date().toISOString(),
    description: `${user.firstName} ${user.lastName}`.trim() + ` added ${contact.firstName} ${contact.lastName}.`,
    id: createId("auto"),
    title: "Contact created",
  });

  return clone(contact);
};

export const updateMockContact = (
  tenantId: string,
  contactId: string,
  patch: Partial<IContact>,
) => {
  const workspace = getWorkspaceState(tenantId);
  const index = workspace.salesData.contacts.findIndex((item) => item.id === contactId);

  if (index < 0) {
    return null;
  }

  workspace.salesData.contacts[index] = {
    ...workspace.salesData.contacts[index],
    ...patch,
  };

  return clone(workspace.salesData.contacts[index]);
};

export const deleteMockContact = (tenantId: string, contactId: string) => {
  const workspace = getWorkspaceState(tenantId);
  workspace.salesData.contacts = workspace.salesData.contacts.filter((item) => item.id !== contactId);
};

export const listMockOpportunities = (tenantId: string) =>
  clone(getWorkspaceState(tenantId).salesData.opportunities);

export const listMockProposals = (tenantId: string) =>
  clone(getWorkspaceState(tenantId).salesData.proposals);

export const getMockProposal = (tenantId: string, proposalId: string) =>
  clone(
    getWorkspaceState(tenantId).salesData.proposals.find((item) => item.id === proposalId) ??
      null,
  );

export const createMockOpportunity = (
  user: IMockUser,
  input: CreateOpportunityInput,
) => {
  const workspace = getWorkspaceState(user.tenantId);
  const owner =
    workspace.salesData.teamMembers.find((item) => item.id === input.ownerId) ??
    getDefaultOwner(workspace.salesData, input.clientId, input.estimatedValue);
  const opportunity: IOpportunity = {
    clientId: input.clientId,
    contactId: input.contactId,
    createdDate: new Date().toISOString().split("T")[0],
    currency: "ZAR",
    description: input.description,
    estimatedValue: input.estimatedValue,
    expectedCloseDate: normalizeDate(input.expectedCloseDate),
    id: createId("opp"),
    name: input.title,
    nextStep: "Validate scope and confirm the next client-facing action.",
    ownerId: owner?.id,
    probability: input.probability ?? 50,
    source: input.source ?? 1,
    stage: input.stage ?? OpportunityStage.New,
    title: input.title,
    value: input.estimatedValue,
  };

  workspace.salesData.opportunities.push(opportunity);

  workspace.salesData.automationFeed.unshift({
    createdAt: new Date().toISOString(),
    description: `${user.firstName} ${user.lastName}`.trim() + ` created ${opportunity.title}.`,
    id: createId("auto"),
    title: `Opportunity added to pipeline`,
  });

  return clone(opportunity);
};

export const updateMockOpportunity = (
  tenantId: string,
  opportunityId: string,
  patch: Partial<IOpportunity>,
) => {
  const workspace = getWorkspaceState(tenantId);
  const index = workspace.salesData.opportunities.findIndex((item) => item.id === opportunityId);

  if (index < 0) {
    return null;
  }

  workspace.salesData.opportunities[index] = {
    ...workspace.salesData.opportunities[index],
    ...patch,
    expectedCloseDate: normalizeDate(
      patch.expectedCloseDate ?? workspace.salesData.opportunities[index].expectedCloseDate,
    ),
  };

  return clone(workspace.salesData.opportunities[index]);
};

export const deleteMockOpportunity = (tenantId: string, opportunityId: string) => {
  const workspace = getWorkspaceState(tenantId);
  workspace.salesData.opportunities = workspace.salesData.opportunities.filter(
    (item) => item.id !== opportunityId,
  );
  workspace.salesData.proposals = workspace.salesData.proposals.filter(
    (item) => item.opportunityId !== opportunityId,
  );
};

export const assignMockOpportunity = (
  tenantId: string,
  opportunityId: string,
  ownerId: string,
) => {
  const workspace = getWorkspaceState(tenantId);
  const owner = workspace.salesData.teamMembers.find((item) => item.id === ownerId);

  if (!owner) {
    return null;
  }

  return updateMockOpportunity(tenantId, opportunityId, { ownerId: owner.id });
};

export const updateMockOpportunityStage = (
  tenantId: string,
  opportunityId: string,
  stage: string,
) => updateMockOpportunity(tenantId, opportunityId, { stage });

export const createMockProposal = (user: IMockUser, input: CreateProposalInput) => {
  const workspace = getWorkspaceState(user.tenantId);
  const opportunity = workspace.salesData.opportunities.find(
    (item) => item.id === input.opportunityId,
  );

  if (!opportunity) {
    throw new Error("Opportunity not found in the current mock workspace.");
  }

  const lineItems = (input.lineItems ?? []).map((item) => ({
    ...item,
    id: item.id ?? createId("line"),
  }));
  const proposal: IProposal = {
    clientId: opportunity.clientId,
    createdAt: new Date().toISOString(),
    currency: input.currency ?? "ZAR",
    description: input.description,
    id: createId("prop"),
    lineItems,
    lineItemsCount: lineItems.length,
    opportunityId: opportunity.id,
    status: ProposalStatus.Draft,
    title: input.title,
    validUntil: normalizeDate(input.validUntil),
    value: getLineItemsTotal(lineItems) || opportunity.value || opportunity.estimatedValue,
  };

  workspace.salesData.proposals.push(proposal);
  workspace.salesData.automationFeed.unshift({
    createdAt: new Date().toISOString(),
    description: `${user.firstName} ${user.lastName}`.trim() + ` drafted ${proposal.title}.`,
    id: createId("auto"),
    title: `Proposal created`,
  });

  return clone(proposal);
};

export const updateMockProposal = (
  tenantId: string,
  proposalId: string,
  patch: Partial<IProposal>,
) => {
  const workspace = getWorkspaceState(tenantId);
  const index = workspace.salesData.proposals.findIndex((item) => item.id === proposalId);

  if (index < 0) {
    return null;
  }

  const nextLineItems = patch.lineItems ?? workspace.salesData.proposals[index].lineItems ?? [];

  workspace.salesData.proposals[index] = {
    ...workspace.salesData.proposals[index],
    ...patch,
    lineItems: nextLineItems,
    lineItemsCount: nextLineItems.length,
    validUntil: normalizeDate(
      patch.validUntil ?? workspace.salesData.proposals[index].validUntil,
    ),
    value:
      patch.value ??
      getLineItemsTotal(nextLineItems) ??
      workspace.salesData.proposals[index].value,
  };

  return clone(workspace.salesData.proposals[index]);
};

export const deleteMockProposal = (tenantId: string, proposalId: string) => {
  const workspace = getWorkspaceState(tenantId);
  workspace.salesData.proposals = workspace.salesData.proposals.filter(
    (item) => item.id !== proposalId,
  );
};

export const transitionMockProposal = (
  tenantId: string,
  proposalId: string,
  status: ProposalStatus | string,
  decisionNote?: string,
) => {
  const proposal = updateMockProposal(tenantId, proposalId, {
    description: decisionNote?.trim()
      ? [getMockProposal(tenantId, proposalId)?.description, `Decision note: ${decisionNote.trim()}`]
          .filter(Boolean)
          .join("\n\n")
      : getMockProposal(tenantId, proposalId)?.description,
    status,
  });

  if (!proposal) {
    return null;
  }

  if (status === ProposalStatus.Approved) {
    proposal.approvedDate = new Date().toISOString().split("T")[0];
  }

  if (status === ProposalStatus.Submitted) {
    proposal.submittedDate = new Date().toISOString().split("T")[0];
  }

  return updateMockProposal(tenantId, proposalId, proposal);
};

export const addMockProposalLineItem = (
  tenantId: string,
  proposalId: string,
  lineItem: NonNullable<IProposal["lineItems"]>[number],
) => {
  const proposal = getMockProposal(tenantId, proposalId);

  if (!proposal) {
    return null;
  }

  const nextLineItems = [
    ...(proposal.lineItems ?? []),
    {
      ...lineItem,
      id: lineItem.id ?? createId("line"),
    },
  ];

  return updateMockProposal(tenantId, proposalId, { lineItems: nextLineItems });
};

export const updateMockProposalLineItem = (
  tenantId: string,
  proposalId: string,
  lineItemId: string,
  patch: NonNullable<IProposal["lineItems"]>[number],
) => {
  const proposal = getMockProposal(tenantId, proposalId);

  if (!proposal) {
    return null;
  }

  const nextLineItems = (proposal.lineItems ?? []).map((item) =>
    item.id === lineItemId ? { ...item, ...patch, id: lineItemId } : item,
  );

  return updateMockProposal(tenantId, proposalId, { lineItems: nextLineItems });
};

export const deleteMockProposalLineItem = (
  tenantId: string,
  proposalId: string,
  lineItemId: string,
) => {
  const proposal = getMockProposal(tenantId, proposalId);

  if (!proposal) {
    return null;
  }

  return updateMockProposal(tenantId, proposalId, {
    lineItems: (proposal.lineItems ?? []).filter((item) => item.id !== lineItemId),
  });
};

export const listMockTeamMembers = (tenantId: string): ITeamMember[] =>
  clone(getWorkspaceState(tenantId).salesData.teamMembers);

export const listMockActivities = (tenantId: string): IActivity[] =>
  clone(getWorkspaceState(tenantId).salesData.activities);

export const createMockActivity = (user: IMockUser, input: CreateActivityInput) => {
  const workspace = getWorkspaceState(user.tenantId);
  const assignedOwner = input.assignedToId
    ? workspace.salesData.teamMembers.find((member) => member.id === input.assignedToId)
    : undefined;
  const activity: IActivity = {
    ...input,
    assignedToName: input.assignedToName ?? assignedOwner?.name,
    completed: input.completed ?? false,
    createdAt: new Date().toISOString(),
    dueDate: normalizeDate(input.dueDate),
    id: input.id ?? createId("act"),
    status: input.status ?? "Scheduled",
    title: input.title ?? input.subject,
  };

  workspace.salesData.activities.push(activity);
  workspace.salesData.automationFeed.unshift({
    createdAt: new Date().toISOString(),
    description: `${user.firstName} ${user.lastName}`.trim() + ` logged ${activity.subject}.`,
    id: createId("auto"),
    title: "Activity created",
  });

  return clone(activity);
};

export const updateMockActivity = (
  tenantId: string,
  activityId: string,
  patch: Partial<IActivity>,
) => {
  const workspace = getWorkspaceState(tenantId);
  const index = workspace.salesData.activities.findIndex((item) => item.id === activityId);

  if (index < 0) {
    return null;
  }

  workspace.salesData.activities[index] = {
    ...workspace.salesData.activities[index],
    ...patch,
  };

  return clone(workspace.salesData.activities[index]);
};

export const deleteMockActivity = (tenantId: string, activityId: string) => {
  const workspace = getWorkspaceState(tenantId);
  workspace.salesData.activities = workspace.salesData.activities.filter(
    (item) => item.id !== activityId,
  );
};

export const listMockPricingRequests = (tenantId: string): IPricingRequest[] =>
  clone(getWorkspaceState(tenantId).pricingRequests);

export const createMockPricingRequest = (
  user: IMockUser,
  input: CreatePricingRequestInput,
) => {
  const workspace = getWorkspaceState(user.tenantId);
  const pricingRequest: IPricingRequest = {
    ...input,
    createdAt: new Date().toISOString(),
    id: input.id ?? createId("price"),
    requiredByDate: normalizeDate(input.requiredByDate),
  };

  workspace.pricingRequests.push(pricingRequest);
  workspace.salesData.automationFeed.unshift({
    createdAt: new Date().toISOString(),
    description:
      `${user.firstName} ${user.lastName}`.trim() + ` submitted ${pricingRequest.title}.`,
    id: createId("auto"),
    title: "Commercial request created",
  });

  return clone(pricingRequest);
};

export const updateMockPricingRequest = (
  tenantId: string,
  pricingRequestId: string,
  patch: Partial<IPricingRequest>,
) => {
  const workspace = getWorkspaceState(tenantId);
  const index = workspace.pricingRequests.findIndex((item) => item.id === pricingRequestId);

  if (index < 0) {
    return null;
  }

  workspace.pricingRequests[index] = {
    ...workspace.pricingRequests[index],
    ...patch,
    requiredByDate: normalizeDate(
      patch.requiredByDate ?? workspace.pricingRequests[index].requiredByDate,
    ),
  };

  return clone(workspace.pricingRequests[index]);
};

export const deleteMockPricingRequest = (tenantId: string, pricingRequestId: string) => {
  const workspace = getWorkspaceState(tenantId);
  workspace.pricingRequests = workspace.pricingRequests.filter(
    (item) => item.id !== pricingRequestId,
  );
};

export const listMockNotes = (tenantId: string): INoteItem[] =>
  clone(getWorkspaceState(tenantId).notes);

export const createMockNote = (
  user: IMockUser,
  input: Omit<INoteItem, "id"> & { id?: string },
) => {
  const workspace = getWorkspaceState(user.tenantId);
  const note: INoteItem = {
    ...input,
    createdDate: normalizeDate(input.createdDate),
    id: input.id ?? createId("note"),
  };

  workspace.notes.push(note);
  workspace.salesData.automationFeed.unshift({
    createdAt: new Date().toISOString(),
    description: `${user.firstName} ${user.lastName}`.trim() + ` captured note "${note.title}".`,
    id: createId("auto"),
    title: "Note created",
  });

  return clone(note);
};

export const updateMockNote = (
  tenantId: string,
  noteId: string,
  patch: Partial<INoteItem>,
) => {
  const workspace = getWorkspaceState(tenantId);
  const index = workspace.notes.findIndex((item) => item.id === noteId);

  if (index < 0) {
    return null;
  }

  workspace.notes[index] = {
    ...workspace.notes[index],
    ...patch,
    createdDate: normalizeDate(patch.createdDate ?? workspace.notes[index].createdDate),
  };

  return clone(workspace.notes[index]);
};

export const deleteMockNote = (tenantId: string, noteId: string) => {
  const workspace = getWorkspaceState(tenantId);
  workspace.notes = workspace.notes.filter((item) => item.id !== noteId);
};

export const syncMockUserWorkspaceProfile = (
  user: IMockUser,
  options: { organizationName?: string } = {},
) => {
  const workspace = getWorkspaceState(user.tenantId);
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const organizationName = options.organizationName?.trim();
  const linkedClientIds = new Set(user.clientIds ?? []);
  const teamMemberIndex = workspace.salesData.teamMembers.findIndex(
    (item) => item.id === user.id,
  );

  if (teamMemberIndex >= 0) {
    workspace.salesData.teamMembers[teamMemberIndex] = {
      ...workspace.salesData.teamMembers[teamMemberIndex],
      name: fullName,
    };
  }

  workspace.salesData.activities = workspace.salesData.activities.map((item) =>
    item.assignedToId === user.id ? { ...item, assignedToName: fullName } : item,
  );

  workspace.pricingRequests = workspace.pricingRequests.map((item) => ({
    ...item,
    assignedToName: item.assignedToId === user.id ? fullName : item.assignedToName,
    requestedByName: item.requestedById === user.id ? fullName : item.requestedByName,
  }));

  workspace.notes = workspace.notes.map((item) => ({
    ...item,
    representativeName:
      item.representativeId === user.id ? fullName : item.representativeName,
  }));

  if (organizationName && linkedClientIds.size > 0) {
    workspace.salesData.clients = workspace.salesData.clients.map((item) =>
      linkedClientIds.has(item.id) ? { ...item, name: organizationName } : item,
    );
  }

  workspace.salesData.automationFeed.unshift({
    createdAt: new Date().toISOString(),
    description:
      linkedClientIds.size > 0 && organizationName
        ? `${fullName} updated the linked client workspace name to ${organizationName}.`
        : `${fullName} updated their workspace profile details.`,
    id: createId("auto"),
    title: linkedClientIds.size > 0 && organizationName ? "Client workspace updated" : "Profile updated",
  });

  return clone(workspace);
};
