import "server-only";

import type { IMockUser } from "@/app/api/Auth/mock-users";
import type { INoteItem } from "@/providers/domainSeeds";
import {
  ActivityStatus,
  ActivityType,
  OpportunityStage,
  ProposalStatus,
  type IActivity,
  type IClient,
  type IContact,
  type ILineItem,
  type IOpportunity,
  type IPricingRequest,
  type IProposal,
  type ISalesData,
  type ITeamMember,
} from "@/providers/salesTypes";

import { createBackendUrl } from "./backend-url";

type BackendPagedResult<T> = {
  items?: T[] | null;
};

type BackendClientDto = {
  billingAddress?: string | null;
  clientType?: number;
  companySize?: string | null;
  createdAt?: string | null;
  id: string;
  industry?: string | null;
  isActive?: boolean;
  name?: string | null;
  taxNumber?: string | null;
  website?: string | null;
};

type BackendContactDto = {
  clientId: string;
  email?: string | null;
  firstName?: string | null;
  id: string;
  isPrimaryContact?: boolean;
  lastName?: string | null;
  phoneNumber?: string | null;
  position?: string | null;
};

type BackendOpportunityDto = {
  clientId: string;
  contactId?: string | null;
  createdAt?: string | null;
  currency?: string | null;
  description?: string | null;
  estimatedValue?: number;
  expectedCloseDate?: string | null;
  id: string;
  ownerId?: string | null;
  probability?: number;
  source?: number;
  stage?: number | string | null;
  stageName?: string | null;
  title?: string | null;
};

type BackendProposalLineItemDto = {
  description?: string | null;
  discount?: number;
  id?: string;
  productServiceName?: string | null;
  quantity?: number;
  taxRate?: number;
  unitPrice?: number;
};

type BackendProposalDto = {
  approvedDate?: string | null;
  clientId: string;
  createdAt?: string | null;
  currency?: string | null;
  description?: string | null;
  id: string;
  lineItems?: BackendProposalLineItemDto[] | null;
  lineItemsCount?: number;
  opportunityId: string;
  proposalNumber?: string | null;
  status?: number | string | null;
  statusName?: string | null;
  submittedDate?: string | null;
  title?: string | null;
  totalAmount?: number;
  validUntil?: string | null;
};

type BackendPricingRequestDto = {
  assignedToId?: string | null;
  assignedToName?: string | null;
  completedDate?: string | null;
  createdAt?: string | null;
  description?: string | null;
  id: string;
  opportunityId: string;
  opportunityTitle?: string | null;
  priority?: number;
  priorityName?: string | null;
  requestNumber?: string | null;
  requestedById?: string | null;
  requestedByName?: string | null;
  requiredByDate?: string | null;
  status?: number | string | null;
  statusName?: string | null;
  title?: string | null;
  updatedAt?: string | null;
};

type BackendActivityDto = {
  assignedToId?: string | null;
  assignedToName?: string | null;
  createdAt?: string | null;
  description?: string | null;
  dueDate?: string | null;
  duration?: number | null;
  id: string;
  location?: string | null;
  priority?: number;
  relatedToId?: string | null;
  relatedToType?: number;
  status?: number | string | null;
  statusName?: string | null;
  subject?: string | null;
  type?: number | string | null;
  typeName?: string | null;
};

type BackendUserDto = {
  availabilityPercent?: number;
  email?: string | null;
  firstName?: string | null;
  fullName?: string | null;
  id: string;
  lastName?: string | null;
  region?: string | null;
  role?: string | null;
  roles?: string[] | null;
  skills?: string[] | null;
};

const toDateOnly = (value?: string | null) => value?.split("T")[0] ?? "";

const toDateTimePayload = (value?: string | null) => {
  if (!value) {
    return null;
  }

  if (value.includes("T")) {
    return value;
  }

  return `${value}T09:00:00`;
};

const extractErrorMessage = (value: unknown) => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (value && typeof value === "object") {
    const candidate = value as {
      detail?: unknown;
      message?: unknown;
      title?: unknown;
    };

    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message;
    }

    if (typeof candidate.detail === "string" && candidate.detail.trim()) {
      return candidate.detail;
    }

    if (typeof candidate.title === "string" && candidate.title.trim()) {
      return candidate.title;
    }
  }

  return null;
};

const coerceItems = <T>(payload: BackendPagedResult<T> | T[] | null | undefined) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.items ?? [];
};

const backendStageNameToLocal = (value?: number | string | null, name?: string | null) => {
  const normalized = String(name ?? value ?? "").toLowerCase();

  if (normalized.includes("lead") || normalized === "1" || normalized === "new") {
    return OpportunityStage.New;
  }

  if (normalized.includes("qualified") || normalized === "2") {
    return OpportunityStage.Qualified;
  }

  if (normalized.includes("proposal") || normalized === "3") {
    return OpportunityStage.ProposalSent;
  }

  if (normalized.includes("negoti") || normalized === "4") {
    return OpportunityStage.Negotiating;
  }

  if (normalized.includes("won") || normalized === "5") {
    return OpportunityStage.Won;
  }

  if (normalized.includes("lost") || normalized === "6") {
    return OpportunityStage.Lost;
  }

  return OpportunityStage.New;
};

const localStageToBackend = (stage?: string) => {
  switch (stage) {
    case OpportunityStage.Qualified:
      return 2;
    case OpportunityStage.ProposalSent:
      return 3;
    case OpportunityStage.Negotiating:
      return 4;
    case OpportunityStage.Won:
      return 5;
    case OpportunityStage.Lost:
      return 6;
    case OpportunityStage.New:
    default:
      return 1;
  }
};

const backendProposalStatusToLocal = (value?: number | string | null, name?: string | null) => {
  const normalized = String(name ?? value ?? "").toLowerCase().replace(/\s+/g, "");

  if (normalized.includes("draft") || normalized === "1") {
    return ProposalStatus.Draft;
  }

  if (normalized.includes("submitted") || normalized === "2") {
    return ProposalStatus.Submitted;
  }

  if (normalized.includes("rejected") || normalized.includes("declined") || normalized === "3") {
    return ProposalStatus.Rejected;
  }

  if (normalized.includes("approved") || normalized === "4") {
    return ProposalStatus.Approved;
  }

  return name?.trim() || ProposalStatus.Draft;
};

const normalizePricingRequestStatus = (value?: number | string | null, name?: string | null) => {
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  switch (value) {
    case 1:
      return "Pending";
    case 2:
      return "In Progress";
    case 3:
      return "Completed";
    case 4:
      return "Cancelled";
    default:
      return "Pending";
  }
};

const backendActivityTypeToLocal = (value?: number | string | null, name?: string | null) => {
  const normalized = String(name ?? value ?? "").toLowerCase().replace(/\s+/g, "");

  switch (normalized) {
    case "1":
    case "meeting":
      return ActivityType.Meeting;
    case "2":
    case "call":
      return ActivityType.Call;
    case "3":
    case "email":
      return ActivityType.Email;
    case "4":
    case "task":
      return ActivityType.Task;
    case "5":
    case "presentation":
      return ActivityType.Presentation;
    default:
      return ActivityType.Other;
  }
};

const backendActivityStatusToLocal = (value?: number | string | null, name?: string | null) => {
  const normalized = String(name ?? value ?? "").toLowerCase().replace(/\s+/g, "");

  switch (normalized) {
    case "1":
    case "scheduled":
      return ActivityStatus.Scheduled;
    case "2":
    case "completed":
      return ActivityStatus.Completed;
    case "3":
    case "cancelled":
    case "canceled":
      return ActivityStatus.Cancelled;
    default:
      return ActivityStatus.Scheduled;
  }
};

const mapBackendProposalLineItem = (item: BackendProposalLineItemDto): ILineItem => ({
  description: item.description ?? undefined,
  discount: item.discount ?? 0,
  id: item.id,
  productServiceName: item.productServiceName ?? "Line item",
  quantity: item.quantity ?? 1,
  taxRate: item.taxRate ?? 0,
  unitPrice: item.unitPrice ?? 0,
});

const mapBackendClient = (client: BackendClientDto): IClient => ({
  billingAddress: client.billingAddress ?? undefined,
  clientType: client.clientType ?? 2,
  companySize: client.companySize ?? undefined,
  createdAt: client.createdAt ?? undefined,
  id: client.id,
  industry: client.industry ?? "Unknown industry",
  isActive: client.isActive ?? true,
  name: client.name ?? "Unnamed client",
  segment: client.companySize ?? undefined,
  taxNumber: client.taxNumber ?? undefined,
  website: client.website ?? undefined,
});

const mapBackendContact = (contact: BackendContactDto): IContact => ({
  clientId: contact.clientId,
  createdAt: undefined,
  email: contact.email ?? "",
  firstName: contact.firstName ?? "",
  id: contact.id,
  isPrimaryContact: contact.isPrimaryContact ?? false,
  lastName: contact.lastName ?? "",
  phoneNumber: contact.phoneNumber ?? undefined,
  position: contact.position ?? "",
});

const mapBackendOpportunity = (opportunity: BackendOpportunityDto): IOpportunity => ({
  clientId: opportunity.clientId,
  contactId: opportunity.contactId ?? undefined,
  createdDate: toDateOnly(opportunity.createdAt),
  currency: opportunity.currency ?? "ZAR",
  description: opportunity.description ?? undefined,
  estimatedValue: opportunity.estimatedValue ?? 0,
  expectedCloseDate: toDateOnly(opportunity.expectedCloseDate),
  id: opportunity.id,
  name: opportunity.title ?? undefined,
  ownerId: opportunity.ownerId ?? undefined,
  probability: opportunity.probability ?? 0,
  source: opportunity.source ?? 1,
  stage: backendStageNameToLocal(opportunity.stage, opportunity.stageName),
  title: opportunity.title ?? "Untitled opportunity",
  value: opportunity.estimatedValue ?? 0,
});

const mapBackendProposal = (proposal: BackendProposalDto): IProposal => ({
  approvedDate: toDateOnly(proposal.approvedDate),
  clientId: proposal.clientId,
  createdAt: proposal.createdAt ?? undefined,
  currency: proposal.currency ?? "ZAR",
  description: proposal.description ?? undefined,
  id: proposal.id,
  lineItems: proposal.lineItems?.map(mapBackendProposalLineItem) ?? undefined,
  lineItemsCount: proposal.lineItemsCount ?? proposal.lineItems?.length ?? 0,
  opportunityId: proposal.opportunityId,
  proposalNumber: proposal.proposalNumber ?? undefined,
  status: backendProposalStatusToLocal(proposal.status, proposal.statusName),
  submittedDate: toDateOnly(proposal.submittedDate),
  title: proposal.title ?? "Untitled proposal",
  validUntil: toDateOnly(proposal.validUntil),
  value: proposal.totalAmount ?? 0,
});

const mapBackendPricingRequest = (request: BackendPricingRequestDto): IPricingRequest => ({
  assignedToId: request.assignedToId ?? undefined,
  assignedToName: request.assignedToName ?? undefined,
  completedDate: toDateOnly(request.completedDate),
  createdAt: request.createdAt ?? new Date().toISOString(),
  description: request.description ?? undefined,
  id: request.id,
  opportunityId: request.opportunityId,
  opportunityTitle: request.opportunityTitle ?? undefined,
  priority: request.priority ?? 2,
  priorityLabel: request.priorityName ?? undefined,
  requestNumber: request.requestNumber ?? undefined,
  requestedById: request.requestedById ?? undefined,
  requestedByName: request.requestedByName ?? undefined,
  requiredByDate: toDateOnly(request.requiredByDate),
  status: normalizePricingRequestStatus(request.status, request.statusName),
  title: request.title ?? "Untitled pricing request",
  updatedAt: request.updatedAt ?? undefined,
});

const mapBackendActivity = (activity: BackendActivityDto): IActivity => {
  const status = backendActivityStatusToLocal(activity.status, activity.statusName);

  return {
    assignedToId: activity.assignedToId ?? undefined,
    assignedToName: activity.assignedToName ?? undefined,
    completed: status === ActivityStatus.Completed,
    createdAt: activity.createdAt ?? undefined,
    description: activity.description ?? "",
    dueDate: toDateOnly(activity.dueDate),
    duration: activity.duration ?? undefined,
    id: activity.id,
    location: activity.location ?? undefined,
    priority: activity.priority ?? 2,
    relatedToId: activity.relatedToId ?? "",
    relatedToType: activity.relatedToType ?? 2,
    status,
    subject: activity.subject ?? "Untitled activity",
    title: activity.subject ?? "Untitled activity",
    type: backendActivityTypeToLocal(activity.type, activity.typeName),
  };
};

const mapBackendUser = (user: BackendUserDto): ITeamMember => {
  const fullName =
    user.fullName?.trim() ||
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.email?.trim() ||
    "Team member";
  const role = user.role ?? user.roles?.[0] ?? "Team member";

  return {
    availabilityPercent: user.availabilityPercent ?? 70,
    id: user.id,
    name: fullName,
    region: user.region ?? "Unassigned",
    role,
    skills: user.skills ?? [],
  };
};

const toProposalLineItemPayload = (item: ILineItem) => ({
  description: item.description ?? null,
  discount: item.discount ?? 0,
  productServiceName: item.productServiceName,
  quantity: item.quantity,
  taxRate: item.taxRate ?? 0,
  unitPrice: item.unitPrice,
});

const buildCreateOpportunityPayload = (opportunity: IOpportunity) => ({
  clientId: opportunity.clientId,
  contactId: opportunity.contactId ?? null,
  currency: opportunity.currency ?? "ZAR",
  description: opportunity.description ?? null,
  estimatedValue: opportunity.value ?? opportunity.estimatedValue,
  expectedCloseDate: toDateTimePayload(opportunity.expectedCloseDate),
  probability: opportunity.probability,
  source: opportunity.source ?? 1,
  stage: localStageToBackend(String(opportunity.stage)),
  title: opportunity.title,
});

const buildUpdateOpportunityPayload = (opportunity: IOpportunity) => ({
  contactId: opportunity.contactId ?? null,
  currency: opportunity.currency ?? "ZAR",
  description: opportunity.description ?? null,
  estimatedValue: opportunity.value ?? opportunity.estimatedValue,
  expectedCloseDate: toDateTimePayload(opportunity.expectedCloseDate),
  probability: opportunity.probability,
  source: opportunity.source ?? 1,
  title: opportunity.title,
});

const buildCreateProposalPayload = (proposal: IProposal) => ({
  currency: proposal.currency ?? "ZAR",
  description: proposal.description ?? null,
  lineItems: proposal.lineItems?.map(toProposalLineItemPayload) ?? [],
  opportunityId: proposal.opportunityId,
  title: proposal.title,
  validUntil: toDateTimePayload(proposal.validUntil),
});

const buildUpdateProposalPayload = (proposal: IProposal) => ({
  currency: proposal.currency ?? "ZAR",
  description: proposal.description ?? null,
  title: proposal.title,
  validUntil: toDateTimePayload(proposal.validUntil),
});

const fetchBackend = async <T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(createBackendUrl(path), {
    ...init,
    headers,
  });

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(payload) ?? `Backend request failed with status ${response.status}.`,
    );
  }

  return payload as T;
};

const tryFetchBackend = async <T>(
  token: string,
  path: string,
  fallback: T,
  init: RequestInit = {},
) => {
  try {
    return await fetchBackend<T>(token, path, init);
  } catch (error) {
    console.warn(`Assistant backend loader skipped ${path}.`, error);
    return fallback;
  }
};

export const isMockAssistantSessionToken = (token?: string | null) =>
  Boolean(token?.startsWith("mock-token::"));

export const loadAssistantLiveWorkspace = async (user: IMockUser, token: string) => {
  const teamPath = `/api/Users?pageNumber=1&pageSize=100&isActive=true${
    user.role === "SalesRep" ? "&role=SalesRep" : ""
  }`;

  const [
    clientsPayload,
    contactsPayload,
    opportunitiesPayload,
    proposalsPayload,
    activitiesPayload,
    pricingRequestsPayload,
    teamMembersPayload,
    notesPayload,
  ] = await Promise.all([
    fetchBackend<BackendPagedResult<BackendClientDto> | BackendClientDto[]>(token, "/api/Clients?pageNumber=1&pageSize=100"),
    tryFetchBackend<BackendPagedResult<BackendContactDto> | BackendContactDto[]>(
      token,
      "/api/Contacts?pageNumber=1&pageSize=100",
      [],
    ),
    fetchBackend<BackendPagedResult<BackendOpportunityDto> | BackendOpportunityDto[]>(token, "/api/Opportunities?pageNumber=1&pageSize=100"),
    fetchBackend<BackendPagedResult<BackendProposalDto> | BackendProposalDto[]>(token, "/api/Proposals?pageNumber=1&pageSize=100"),
    tryFetchBackend<BackendPagedResult<BackendActivityDto> | BackendActivityDto[]>(
      token,
      "/api/Activities?pageNumber=1&pageSize=100",
      [],
    ),
    tryFetchBackend<BackendPagedResult<BackendPricingRequestDto> | BackendPricingRequestDto[]>(
      token,
      "/api/PricingRequests?pageNumber=1&pageSize=100",
      [],
    ),
    fetchBackend<BackendPagedResult<BackendUserDto> | BackendUserDto[]>(token, teamPath),
    tryFetchBackend<{ items?: INoteItem[] } | INoteItem[]>(token, "/api/Notes", []),
  ]);

  const salesData: ISalesData = {
    activities: coerceItems(activitiesPayload).map(mapBackendActivity),
    automationFeed: [],
    clients: coerceItems(clientsPayload).map(mapBackendClient),
    contacts: coerceItems(contactsPayload).map(mapBackendContact),
    contracts: [],
    opportunities: coerceItems(opportunitiesPayload).map(mapBackendOpportunity),
    proposals: coerceItems(proposalsPayload).map(mapBackendProposal),
    renewals: [],
    teamMembers: coerceItems(teamMembersPayload).map(mapBackendUser),
  };

  return {
    documents: [],
    notes: coerceItems(notesPayload),
    pricingRequests: coerceItems(pricingRequestsPayload).map(mapBackendPricingRequest),
    salesData,
  };
};

export const createLiveOpportunity = async (token: string, payload: IOpportunity) => {
  let opportunity = mapBackendOpportunity(
    await fetchBackend<BackendOpportunityDto>(token, "/api/Opportunities", {
      body: JSON.stringify(buildCreateOpportunityPayload(payload)),
      method: "POST",
    }),
  );

  if (payload.ownerId) {
    await fetchBackend<void>(token, `/api/Opportunities/${opportunity.id}/assign`, {
      body: JSON.stringify({ userId: payload.ownerId }),
      method: "PUT",
    });
  }

  if (payload.stage && String(payload.stage) !== OpportunityStage.New) {
    await fetchBackend<void>(token, `/api/Opportunities/${opportunity.id}/stage`, {
      body: JSON.stringify({
        lossReason: null,
        notes: null,
        stage: localStageToBackend(String(payload.stage)),
      }),
      method: "PUT",
    });
  }

  opportunity = mapBackendOpportunity(
    await fetchBackend<BackendOpportunityDto>(token, `/api/Opportunities/${opportunity.id}`),
  );

  return opportunity;
};

export const updateLiveOpportunity = async (token: string, payload: IOpportunity) => {
  const existing = mapBackendOpportunity(
    await fetchBackend<BackendOpportunityDto>(token, `/api/Opportunities/${payload.id}`),
  );

  let opportunity = mapBackendOpportunity(
    await fetchBackend<BackendOpportunityDto>(token, `/api/Opportunities/${payload.id}`, {
      body: JSON.stringify(buildUpdateOpportunityPayload(payload)),
      method: "PUT",
    }),
  );

  if (payload.ownerId && payload.ownerId !== existing.ownerId) {
    await fetchBackend<void>(token, `/api/Opportunities/${payload.id}/assign`, {
      body: JSON.stringify({ userId: payload.ownerId }),
      method: "PUT",
    });
  }

  if (payload.stage && payload.stage !== existing.stage) {
    await fetchBackend<void>(token, `/api/Opportunities/${payload.id}/stage`, {
      body: JSON.stringify({
        lossReason: null,
        notes: null,
        stage: localStageToBackend(String(payload.stage)),
      }),
      method: "PUT",
    });
  }

  opportunity = mapBackendOpportunity(
    await fetchBackend<BackendOpportunityDto>(token, `/api/Opportunities/${payload.id}`),
  );

  return opportunity;
};

export const deleteLiveOpportunity = async (token: string, opportunityId: string) => {
  await fetchBackend<void>(token, `/api/Opportunities/${opportunityId}`, {
    method: "DELETE",
  });
};

export const createLiveProposal = async (token: string, payload: IProposal) =>
  mapBackendProposal(
    await fetchBackend<BackendProposalDto>(token, "/api/Proposals", {
      body: JSON.stringify(buildCreateProposalPayload(payload)),
      method: "POST",
    }),
  );

export const updateLiveProposal = async (token: string, payload: IProposal) =>
  mapBackendProposal(
    await fetchBackend<BackendProposalDto>(token, `/api/Proposals/${payload.id}`, {
      body: JSON.stringify(buildUpdateProposalPayload(payload)),
      method: "PUT",
    }),
  );

export const deleteLiveProposal = async (token: string, proposalId: string) => {
  await fetchBackend<void>(token, `/api/Proposals/${proposalId}`, {
    method: "DELETE",
  });
};
