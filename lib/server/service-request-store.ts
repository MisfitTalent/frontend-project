import "server-only";

import type { IMockUser } from "@/app/api/Auth/mock-users";
import {
  createMockOpportunity,
  createMockPricingRequest,
  createMockProposal,
  listMockOpportunities,
  listMockPricingRequests,
  listMockProposals,
  listMockTeamMembers,
} from "@/lib/server/mock-workspace-store";
import { OpportunityStage } from "@/providers/salesTypes";

export type ServiceRequestStatus =
  | "submitted"
  | "under_review"
  | "proposal_prepared"
  | "awaiting_client_assignment_approval"
  | "client_rejected_assignment"
  | "client_approved_assignment"
  | "awaiting_rep_acceptance"
  | "rep_rejected_assignment"
  | "active"
  | "closed"
  | "cancelled";

export type ServiceRequestPriority = "low" | "medium" | "high" | "critical";

export type ServiceRequestAssignmentStatus =
  | "pending_client_approval"
  | "client_rejected"
  | "client_approved"
  | "pending_rep_response"
  | "rep_rejected"
  | "rep_accepted";

export type WorkflowActorType =
  | "admin"
  | "assistant"
  | "client"
  | "representative"
  | "workspace_user";

export type ServiceRequestRecord = {
  clientId: string;
  contractId?: string;
  createdAt: string;
  description: string;
  id: string;
  opportunityId?: string;
  pricingRequestId?: string;
  priority: ServiceRequestPriority;
  proposalId?: string;
  requestType: string;
  source: "assistant" | "client_portal" | "workspace";
  status: ServiceRequestStatus;
  submittedByUserId: string;
  tenantId: string;
  title: string;
  updatedAt: string;
};

export type ServiceRequestAssignmentRecord = {
  assignedByUserId: string;
  createdAt: string;
  decisionNote?: string;
  id: string;
  representativeName: string;
  representativeUserId: string;
  serviceRequestId: string;
  status: ServiceRequestAssignmentStatus;
  updatedAt: string;
};

export type WorkflowEventRecord = {
  actorType: WorkflowActorType;
  actorUserId?: string;
  createdAt: string;
  eventType: string;
  id: string;
  payloadJson: Record<string, unknown>;
  serviceRequestId: string;
  tenantId: string;
};

type ServiceRequestState = {
  assignments: ServiceRequestAssignmentRecord[];
  events: WorkflowEventRecord[];
  requests: ServiceRequestRecord[];
};

type LinkOpportunityInput = {
  estimatedValue?: number;
  expectedCloseDate?: string;
  mode: "create" | "link";
  opportunityId?: string;
  ownerId?: string;
  stage?: string;
  title?: string;
};

type LinkPricingRequestInput = {
  assignedToId?: string;
  description?: string;
  mode: "create" | "link";
  pricingRequestId?: string;
  priority?: number;
  requiredByDate?: string;
  title?: string;
};

type LinkProposalInput = {
  currency?: string;
  description?: string;
  mode: "create" | "link";
  proposalId?: string;
  title?: string;
  validUntil?: string;
};

declare global {
  var __serviceRequestStore__: Map<string, ServiceRequestState> | undefined;
}

const serviceRequestStore =
  globalThis.__serviceRequestStore__ ?? new Map<string, ServiceRequestState>();

globalThis.__serviceRequestStore__ = serviceRequestStore;

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const clone = <T,>(value: T): T => structuredClone(value);

const nowIso = () => new Date().toISOString();

const normalizeDate = (value?: string | null) => {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }

  return value.split("T")[0];
};

const getTenantState = (tenantId: string) => {
  const existing = serviceRequestStore.get(tenantId);

  if (existing) {
    return existing;
  }

  const next: ServiceRequestState = {
    assignments: [],
    events: [],
    requests: [],
  };

  serviceRequestStore.set(tenantId, next);

  return next;
};

const isClientScopedUser = (user: IMockUser) =>
  user.role === "Client" || (user.clientIds?.length ?? 0) > 0;

const isInternalUser = (user: IMockUser) => user.role !== "Client";

const canSeeRequest = (user: IMockUser, request: ServiceRequestRecord) => {
  if (!isClientScopedUser(user)) {
    return true;
  }

  return (
    user.clientIds?.includes(request.clientId) ||
    request.submittedByUserId === user.id
  );
};

const eventActorTypeForUser = (user: IMockUser): WorkflowActorType => {
  if (user.role === "Client") {
    return "client";
  }

  if (user.role === "SalesRep") {
    return "representative";
  }

  if (user.role === "Admin") {
    return "admin";
  }

  return "workspace_user";
};

const appendEvent = (
  state: ServiceRequestState,
  request: ServiceRequestRecord,
  actor: IMockUser,
  eventType: string,
  payloadJson: Record<string, unknown> = {},
) => {
  state.events.unshift({
    actorType: eventActorTypeForUser(actor),
    actorUserId: actor.id,
    createdAt: nowIso(),
    eventType,
    id: createId("evt"),
    payloadJson,
    serviceRequestId: request.id,
    tenantId: request.tenantId,
  });
};

const getRequestIndex = (state: ServiceRequestState, requestId: string) =>
  state.requests.findIndex((request) => request.id === requestId);

const updateRequestRecord = (
  state: ServiceRequestState,
  requestId: string,
  patch: Partial<ServiceRequestRecord>,
) => {
  const index = getRequestIndex(state, requestId);

  if (index < 0) {
    return null;
  }

  state.requests[index] = {
    ...state.requests[index],
    ...patch,
    updatedAt: nowIso(),
  };

  return state.requests[index];
};

const getVisibleRequestOrThrow = (user: IMockUser, requestId: string) => {
  const state = getTenantState(user.tenantId);
  const request = state.requests.find((item) => item.id === requestId);

  if (!request) {
    throw new Error("Service request not found.");
  }

  if (!canSeeRequest(user, request)) {
    throw new Error("You do not have access to this service request.");
  }

  return { request, state };
};

const requireInternalUser = (user: IMockUser) => {
  if (!isInternalUser(user)) {
    throw new Error("Only internal workspace users can perform this action.");
  }
};

const requireClientUser = (user: IMockUser) => {
  if (user.role !== "Client") {
    throw new Error("Only client users can perform this action.");
  }
};

const toServiceRequestDetail = (
  state: ServiceRequestState,
  request: ServiceRequestRecord,
) => ({
  assignments: clone(
    state.assignments.filter((assignment) => assignment.serviceRequestId === request.id),
  ),
  events: clone(
    state.events.filter((event) => event.serviceRequestId === request.id),
  ),
  request: clone(request),
});

const getAssignmentRecords = (state: ServiceRequestState, requestId: string) =>
  state.assignments.filter((assignment) => assignment.serviceRequestId === requestId);

export const listServiceRequests = (
  user: IMockUser,
  filters?: { statuses?: ServiceRequestStatus[] },
) => {
  const state = getTenantState(user.tenantId);
  const statuses = new Set(filters?.statuses ?? []);

  return clone(
    state.requests.filter((request) => {
      if (!canSeeRequest(user, request)) {
        return false;
      }

      if (statuses.size > 0 && !statuses.has(request.status)) {
        return false;
      }

      return true;
    }),
  );
};

export const getServiceRequestDetail = (user: IMockUser, requestId: string) => {
  const { request, state } = getVisibleRequestOrThrow(user, requestId);
  return toServiceRequestDetail(state, request);
};

export const createServiceRequest = (
  user: IMockUser,
  input: {
    clientId: string;
    description: string;
    priority?: ServiceRequestPriority;
    requestType?: string;
    source?: ServiceRequestRecord["source"];
    title: string;
  },
) => {
  const state = getTenantState(user.tenantId);
  const now = nowIso();
  const request: ServiceRequestRecord = {
    clientId: input.clientId,
    createdAt: now,
    description: input.description,
    id: createId("req"),
    priority: input.priority ?? "medium",
    requestType: input.requestType ?? "service_request",
    source: input.source ?? (isClientScopedUser(user) ? "client_portal" : "workspace"),
    status: "submitted",
    submittedByUserId: user.id,
    tenantId: user.tenantId,
    title: input.title,
    updatedAt: now,
  };

  state.requests.unshift(request);
  appendEvent(state, request, user, "service_request_submitted", {
    priority: request.priority,
    requestType: request.requestType,
    source: request.source,
  });

  return clone(request);
};

export const markServiceRequestUnderReview = (user: IMockUser, requestId: string) => {
  requireInternalUser(user);

  const { request, state } = getVisibleRequestOrThrow(user, requestId);
  const updated =
    updateRequestRecord(state, request.id, {
      status: "under_review",
    }) ?? request;

  appendEvent(state, updated, user, "service_request_review_started");

  return clone(updated);
};

export const attachOpportunityToServiceRequest = (
  user: IMockUser,
  requestId: string,
  input: LinkOpportunityInput,
) => {
  requireInternalUser(user);

  const { request, state } = getVisibleRequestOrThrow(user, requestId);

  let opportunityId = input.opportunityId?.trim();
  let createdOpportunity = null;

  if (input.mode === "link") {
    if (!opportunityId) {
      throw new Error("opportunityId is required when mode is link.");
    }

    const existing = listMockOpportunities(user.tenantId).find(
      (item) => item.id === opportunityId && item.clientId === request.clientId,
    );

    if (!existing) {
      throw new Error("Opportunity not found in the current workspace.");
    }
  } else {
    const title = input.title?.trim();

    if (!title) {
      throw new Error("title is required when creating an opportunity.");
    }

    createdOpportunity = createMockOpportunity(user, {
      clientId: request.clientId,
      description: input.title?.trim() || request.description,
      estimatedValue: Math.max(0, Number(input.estimatedValue ?? 0)),
      expectedCloseDate: normalizeDate(input.expectedCloseDate),
      ownerId: input.ownerId?.trim() || undefined,
      stage: input.stage?.trim() || OpportunityStage.New,
      title,
    });
    opportunityId = createdOpportunity.id;
  }

  const updated = updateRequestRecord(state, request.id, {
    opportunityId,
    status: request.status === "submitted" ? "under_review" : request.status,
  });

  if (!updated) {
    throw new Error("Service request not found.");
  }

  appendEvent(state, updated, user, "service_request_opportunity_linked", {
    mode: input.mode,
    opportunityId,
  });

  return {
    opportunity:
      createdOpportunity ??
      listMockOpportunities(user.tenantId).find((item) => item.id === opportunityId) ??
      null,
    request: clone(updated),
  };
};

export const attachProposalToServiceRequest = (
  user: IMockUser,
  requestId: string,
  input: LinkProposalInput,
) => {
  requireInternalUser(user);

  const { request, state } = getVisibleRequestOrThrow(user, requestId);

  let proposalId = input.proposalId?.trim();
  let createdProposal = null;

  if (input.mode === "link") {
    if (!proposalId) {
      throw new Error("proposalId is required when mode is link.");
    }

    const existing = listMockProposals(user.tenantId).find(
      (item) => item.id === proposalId && item.clientId === request.clientId,
    );

    if (!existing) {
      throw new Error("Proposal not found in the current workspace.");
    }
  } else {
    if (!request.opportunityId) {
      throw new Error("The service request needs an opportunity before creating a proposal.");
    }

    const title = input.title?.trim();

    if (!title) {
      throw new Error("title is required when creating a proposal.");
    }

    createdProposal = createMockProposal(user, {
      currency: input.currency?.trim() || "ZAR",
      description: input.description?.trim() || request.description,
      opportunityId: request.opportunityId,
      title,
      validUntil: normalizeDate(input.validUntil),
    });
    proposalId = createdProposal.id;
  }

  const updated = updateRequestRecord(state, request.id, {
    proposalId,
    status: "proposal_prepared",
  });

  if (!updated) {
    throw new Error("Service request not found.");
  }

  appendEvent(state, updated, user, "service_request_proposal_linked", {
    mode: input.mode,
    proposalId,
  });

  return {
    proposal:
      createdProposal ??
      listMockProposals(user.tenantId).find((item) => item.id === proposalId) ??
      null,
    request: clone(updated),
  };
};

export const attachPricingRequestToServiceRequest = (
  user: IMockUser,
  requestId: string,
  input: LinkPricingRequestInput,
) => {
  requireInternalUser(user);

  const { request, state } = getVisibleRequestOrThrow(user, requestId);

  let pricingRequestId = input.pricingRequestId?.trim();
  let createdPricingRequest = null;

  if (input.mode === "link") {
    if (!pricingRequestId) {
      throw new Error("pricingRequestId is required when mode is link.");
    }

    const existing = listMockPricingRequests(user.tenantId).find(
      (item) => item.id === pricingRequestId,
    );

    if (!existing) {
      throw new Error("Pricing request not found in the current workspace.");
    }
  } else {
    if (!request.opportunityId) {
      throw new Error("The service request needs an opportunity before creating a pricing request.");
    }

    const opportunity = listMockOpportunities(user.tenantId).find(
      (item) => item.id === request.opportunityId,
    );

    const title = input.title?.trim();

    if (!title) {
      throw new Error("title is required when creating a pricing request.");
    }

    createdPricingRequest = createMockPricingRequest(user, {
      assignedToId: input.assignedToId?.trim() || undefined,
      description: input.description?.trim() || request.description,
      opportunityId: request.opportunityId,
      opportunityTitle: opportunity?.title,
      priority: input.priority ?? 2,
      requestedById: user.id,
      requestedByName: `${user.firstName} ${user.lastName}`.trim(),
      requiredByDate: normalizeDate(input.requiredByDate),
      status: "Pending",
      title,
    });
    pricingRequestId = createdPricingRequest.id;
  }

  const updated = updateRequestRecord(state, request.id, {
    pricingRequestId,
  });

  if (!updated) {
    throw new Error("Service request not found.");
  }

  appendEvent(state, updated, user, "service_request_pricing_request_linked", {
    mode: input.mode,
    pricingRequestId,
  });

  return {
    pricingRequest:
      createdPricingRequest ??
      listMockPricingRequests(user.tenantId).find((item) => item.id === pricingRequestId) ??
      null,
    request: clone(updated),
  };
};

export const createServiceRequestAssignments = (
  user: IMockUser,
  requestId: string,
  input: {
    note?: string;
    representativeUserIds: string[];
  },
) => {
  requireInternalUser(user);

  const representativeUserIds = [...new Set(input.representativeUserIds.map((value) => value.trim()).filter(Boolean))];

  if (representativeUserIds.length === 0) {
    throw new Error("At least one representative user ID is required.");
  }

  const { request, state } = getVisibleRequestOrThrow(user, requestId);
  const teamMembers = listMockTeamMembers(user.tenantId);
  const nextAssignments: ServiceRequestAssignmentRecord[] = [];

  for (const representativeUserId of representativeUserIds) {
    const representative = teamMembers.find((member) => member.id === representativeUserId);

    if (!representative) {
      throw new Error(`Representative ${representativeUserId} was not found.`);
    }

    nextAssignments.push({
      assignedByUserId: user.id,
      createdAt: nowIso(),
      decisionNote: input.note?.trim() || undefined,
      id: createId("assign"),
      representativeName: representative.name,
      representativeUserId,
      serviceRequestId: request.id,
      status: "pending_client_approval",
      updatedAt: nowIso(),
    });
  }

  state.assignments = state.assignments.filter(
    (assignment) => assignment.serviceRequestId !== request.id,
  );
  state.assignments.unshift(...nextAssignments);

  const updated = updateRequestRecord(state, request.id, {
    status: "awaiting_client_assignment_approval",
  });

  if (!updated) {
    throw new Error("Service request not found.");
  }

  appendEvent(state, updated, user, "service_request_assignments_created", {
    note: input.note?.trim() || null,
    representativeUserIds,
  });

  return {
    assignments: clone(nextAssignments),
    request: clone(updated),
  };
};

export const applyServiceRequestClientDecision = (
  user: IMockUser,
  requestId: string,
  input: {
    assignmentIds: string[];
    decision: "approve" | "reject";
    note?: string;
  },
) => {
  requireClientUser(user);

  const { request, state } = getVisibleRequestOrThrow(user, requestId);
  const assignmentIds = new Set(input.assignmentIds.map((value) => value.trim()).filter(Boolean));
  const matchingAssignments = state.assignments.filter(
    (assignment) =>
      assignment.serviceRequestId === request.id && assignmentIds.has(assignment.id),
  );

  if (matchingAssignments.length === 0) {
    throw new Error("No matching assignments were found for this request.");
  }

  const nextStatus =
    input.decision === "approve" ? "client_approved" : "client_rejected";

  state.assignments = state.assignments.map((assignment) => {
    if (!assignmentIds.has(assignment.id) || assignment.serviceRequestId !== request.id) {
      return assignment;
    }

    return {
      ...assignment,
      decisionNote: input.note?.trim() || assignment.decisionNote,
      status: nextStatus,
      updatedAt: nowIso(),
    };
  });

  const allAssignments = getAssignmentRecords(state, request.id);
  const approvedAssignments = allAssignments.filter(
    (assignment) => assignment.status === "client_approved",
  );

  if (input.decision === "approve") {
    state.assignments = state.assignments.map((assignment) => {
      if (assignment.serviceRequestId !== request.id) {
        return assignment;
      }

      if (assignment.status !== "client_approved") {
        return assignment;
      }

      return {
        ...assignment,
        status: "pending_rep_response",
        updatedAt: nowIso(),
      };
    });
  }

  const updated = updateRequestRecord(state, request.id, {
    status:
      input.decision === "approve" && approvedAssignments.length > 0
        ? "awaiting_rep_acceptance"
        : "client_rejected_assignment",
  });

  if (!updated) {
    throw new Error("Service request not found.");
  }

  appendEvent(state, updated, user, "service_request_client_decision", {
    assignmentIds: [...assignmentIds],
    decision: input.decision,
    note: input.note?.trim() || null,
  });

  return clone(updated);
};

export const applyServiceRequestRepDecision = (
  user: IMockUser,
  requestId: string,
  input: {
    assignmentId: string;
    decision: "accept" | "reject";
    note?: string;
  },
) => {
  const { request, state } = getVisibleRequestOrThrow(user, requestId);
  const assignment = state.assignments.find(
    (item) => item.id === input.assignmentId && item.serviceRequestId === request.id,
  );

  if (!assignment) {
    throw new Error("Assignment not found for this request.");
  }

  if (assignment.representativeUserId !== user.id && user.role !== "Admin") {
    throw new Error("You do not have access to decide this assignment.");
  }

  state.assignments = state.assignments.map((item) =>
    item.id === assignment.id
      ? {
          ...item,
          decisionNote: input.note?.trim() || item.decisionNote,
          status: input.decision === "accept" ? "rep_accepted" : "rep_rejected",
          updatedAt: nowIso(),
        }
      : item,
  );

  const allAssignments = getAssignmentRecords(state, request.id);
  const hasAccepted = allAssignments.some((item) => item.status === "rep_accepted");
  const hasPending = allAssignments.some((item) => item.status === "pending_rep_response");
  const hasRejected = allAssignments.some((item) => item.status === "rep_rejected");

  const updated = updateRequestRecord(state, request.id, {
    status: hasRejected
      ? "rep_rejected_assignment"
      : hasPending
        ? "awaiting_rep_acceptance"
        : hasAccepted
          ? "active"
          : request.status,
  });

  if (!updated) {
    throw new Error("Service request not found.");
  }

  appendEvent(state, updated, user, "service_request_representative_decision", {
    assignmentId: input.assignmentId,
    decision: input.decision,
    note: input.note?.trim() || null,
  });

  return clone(updated);
};
