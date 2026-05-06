import "server-only";

import type { IMockUser } from "@/app/api/Auth/mock-users";
import {
  createLiveOpportunity,
  createLiveProposal,
} from "@/lib/server/assistant-backend";
import { createBackendUrl } from "@/lib/server/backend-url";
import type {
  ServiceRequestAssignmentRecord,
  ServiceRequestPriority,
  ServiceRequestRecord,
  ServiceRequestStatus,
  WorkflowEventRecord,
} from "@/lib/server/service-request-store";
import type { IOpportunity, IProposal } from "@/providers/salesTypes";

type BackendPagedResult<T> = {
  items?: T[] | null;
};

type BackendNoteDto = Record<string, unknown>;

type BackendUserDto = {
  email?: string | null;
  firstName?: string | null;
  fullName?: string | null;
  id: string;
  lastName?: string | null;
};

type WorkflowEnvelope =
  | {
      kind: "request";
      request: ServiceRequestRecord;
      schema: "service-request-workflow-v1";
      tenantId: string;
    }
  | {
      assignment: ServiceRequestAssignmentRecord;
      kind: "assignment";
      schema: "service-request-workflow-v1";
      tenantId: string;
    }
  | {
      event: WorkflowEventRecord;
      kind: "event";
      schema: "service-request-workflow-v1";
      tenantId: string;
    };

type StoredRequestNote = {
  noteId: string;
  request: ServiceRequestRecord;
};

type StoredAssignmentNote = {
  assignment: ServiceRequestAssignmentRecord;
  noteId: string;
};

type StoredEventNote = {
  event: WorkflowEventRecord;
  noteId: string;
};

type LiveWorkflowState = {
  assignments: StoredAssignmentNote[];
  events: StoredEventNote[];
  requests: StoredRequestNote[];
};

const WORKFLOW_NOTE_PREFIX = "__service_request_workflow__:";
const DEFAULT_RELATED_TO_TYPE = 2;

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const nowIso = () => new Date().toISOString();

const normalizeDate = (value?: string | null) => {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }

  return value.split("T")[0];
};

const clone = <T,>(value: T): T => structuredClone(value);

const canSeeRequest = (user: IMockUser, request: ServiceRequestRecord) => {
  if (user.role !== "Client" && (user.clientIds?.length ?? 0) === 0) {
    return true;
  }

  return (
    user.clientIds?.includes(request.clientId) ||
    request.submittedByUserId === user.id
  );
};

const requireInternalUser = (user: IMockUser) => {
  if (user.role === "Client") {
    throw new Error("Only internal workspace users can perform this action.");
  }
};

const requireClientUser = (user: IMockUser) => {
  if (user.role !== "Client") {
    throw new Error("Only client users can perform this action.");
  }
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

const coerceItems = <T,>(payload: BackendPagedResult<T> | T[] | null | undefined) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.items ?? [];
};

const readString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const serializeEnvelope = (envelope: WorkflowEnvelope) =>
  `${WORKFLOW_NOTE_PREFIX}${JSON.stringify(envelope)}`;

const parseEnvelope = (content: unknown): WorkflowEnvelope | null => {
  if (typeof content !== "string" || !content.startsWith(WORKFLOW_NOTE_PREFIX)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      content.slice(WORKFLOW_NOTE_PREFIX.length),
    ) as WorkflowEnvelope;

    if (parsed?.schema !== "service-request-workflow-v1") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

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

const listWorkflowNotes = async (token: string) =>
  coerceItems(
    await fetchBackend<BackendPagedResult<BackendNoteDto> | BackendNoteDto[]>(
      token,
      "/api/Notes?pageNumber=1&pageSize=250",
    ),
  );

const createWorkflowNote = async (
  token: string,
  relatedToId: string,
  envelope: WorkflowEnvelope,
) =>
  fetchBackend<BackendNoteDto>(token, "/api/Notes", {
    body: JSON.stringify({
      content: serializeEnvelope(envelope),
      isPrivate: false,
      relatedToId,
      relatedToType: DEFAULT_RELATED_TO_TYPE,
    }),
    method: "POST",
  });

const updateWorkflowNote = async (
  token: string,
  noteId: string,
  envelope: WorkflowEnvelope,
) => {
  await fetchBackend<BackendNoteDto>(token, `/api/Notes/${noteId}`, {
    body: JSON.stringify({
      content: serializeEnvelope(envelope),
      isPrivate: false,
    }),
    method: "PUT",
  });
};

const loadLiveWorkflowState = async (user: IMockUser, token: string): Promise<LiveWorkflowState> => {
  const notes = await listWorkflowNotes(token);
  const state: LiveWorkflowState = {
    assignments: [],
    events: [],
    requests: [],
  };

  for (const note of notes) {
    const noteId = readString(note.id);
    const envelope = parseEnvelope(note.content);

    if (!noteId || !envelope || envelope.tenantId !== user.tenantId) {
      continue;
    }

    if (envelope.kind === "request") {
      state.requests.push({
        noteId,
        request: envelope.request,
      });
      continue;
    }

    if (envelope.kind === "assignment") {
      state.assignments.push({
        assignment: envelope.assignment,
        noteId,
      });
      continue;
    }

    state.events.push({
      event: envelope.event,
      noteId,
    });
  }

  state.requests.sort((left, right) =>
    right.request.updatedAt.localeCompare(left.request.updatedAt),
  );
  state.assignments.sort((left, right) =>
    right.assignment.updatedAt.localeCompare(left.assignment.updatedAt),
  );
  state.events.sort((left, right) =>
    right.event.createdAt.localeCompare(left.event.createdAt),
  );

  return state;
};

const getVisibleRequestOrThrow = async (
  user: IMockUser,
  token: string,
  requestId: string,
) => {
  const state = await loadLiveWorkflowState(user, token);
  const request = state.requests.find((item) => item.request.id === requestId);

  if (!request) {
    throw new Error("Service request not found.");
  }

  if (!canSeeRequest(user, request.request)) {
    throw new Error("You do not have access to this service request.");
  }

  return { request, state };
};

const fetchTeamMemberNames = async (token: string) => {
  const payload = await fetchBackend<BackendPagedResult<BackendUserDto> | BackendUserDto[]>(
    token,
    "/api/Users?pageNumber=1&pageSize=100",
  );

  return new Map(
    coerceItems(payload).map((user) => {
      const fullName =
        readString(user.fullName) ||
        [readString(user.firstName), readString(user.lastName)].filter(Boolean).join(" ") ||
        readString(user.email) ||
        user.id;

      return [user.id, fullName];
    }),
  );
};

const appendEvent = async (
  token: string,
  request: ServiceRequestRecord,
  actor: IMockUser,
  eventType: string,
  payloadJson: Record<string, unknown> = {},
) => {
  const event: WorkflowEventRecord = {
    actorType:
      actor.role === "Client"
        ? "client"
        : actor.role === "SalesRep"
          ? "representative"
          : actor.role === "Admin"
            ? "admin"
            : "workspace_user",
    actorUserId: actor.id,
    createdAt: nowIso(),
    eventType,
    id: createId("evt"),
    payloadJson,
    serviceRequestId: request.id,
    tenantId: request.tenantId,
  };

  await createWorkflowNote(token, request.clientId, {
    event,
    kind: "event",
    schema: "service-request-workflow-v1",
    tenantId: request.tenantId,
  });

  return event;
};

export const listLiveServiceRequests = async (
  user: IMockUser,
  token: string,
  filters?: { statuses?: ServiceRequestStatus[] },
) => {
  const state = await loadLiveWorkflowState(user, token);
  const statuses = new Set(filters?.statuses ?? []);

  return state.requests
    .map((item) => item.request)
    .filter((request) => {
      if (!canSeeRequest(user, request)) {
        return false;
      }

      if (statuses.size > 0 && !statuses.has(request.status)) {
        return false;
      }

      return true;
    })
    .map(clone);
};

export const createLiveServiceRequest = async (
  user: IMockUser,
  token: string,
  input: {
    clientId: string;
    description: string;
    priority?: ServiceRequestPriority;
    requestType?: string;
    source?: ServiceRequestRecord["source"];
    title: string;
  },
) => {
  const now = nowIso();
  const request: ServiceRequestRecord = {
    clientId: input.clientId,
    createdAt: now,
    description: input.description,
    id: createId("req"),
    priority: input.priority ?? "medium",
    requestType: input.requestType ?? "service_request",
    source:
      input.source ??
      (user.role === "Client" || (user.clientIds?.length ?? 0) > 0
        ? "client_portal"
        : "workspace"),
    status: "submitted",
    submittedByUserId: user.id,
    tenantId: user.tenantId,
    title: input.title,
    updatedAt: now,
  };

  await createWorkflowNote(token, request.clientId, {
    kind: "request",
    request,
    schema: "service-request-workflow-v1",
    tenantId: user.tenantId,
  });

  await appendEvent(token, request, user, "service_request_submitted", {
    priority: request.priority,
    requestType: request.requestType,
    source: request.source,
  });

  return clone(request);
};

export const getLiveServiceRequestDetail = async (
  user: IMockUser,
  token: string,
  requestId: string,
) => {
  const { request, state } = await getVisibleRequestOrThrow(user, token, requestId);

  return {
    assignments: state.assignments
      .filter((item) => item.assignment.serviceRequestId === request.request.id)
      .map((item) => clone(item.assignment)),
    events: state.events
      .filter((item) => item.event.serviceRequestId === request.request.id)
      .map((item) => clone(item.event)),
    request: clone(request.request),
  };
};

export const markLiveServiceRequestUnderReview = async (
  user: IMockUser,
  token: string,
  requestId: string,
) => {
  requireInternalUser(user);

  const { request } = await getVisibleRequestOrThrow(user, token, requestId);
  const updated: ServiceRequestRecord = {
    ...request.request,
    status: "under_review",
    updatedAt: nowIso(),
  };

  await updateWorkflowNote(token, request.noteId, {
    kind: "request",
    request: updated,
    schema: "service-request-workflow-v1",
    tenantId: user.tenantId,
  });

  await appendEvent(token, updated, user, "service_request_review_started");

  return clone(updated);
};

export const createLiveServiceRequestAssignments = async (
  user: IMockUser,
  token: string,
  requestId: string,
  input: {
    note?: string;
    representativeUserIds: string[];
  },
) => {
  requireInternalUser(user);

  const representativeUserIds = [
    ...new Set(input.representativeUserIds.map((value) => value.trim()).filter(Boolean)),
  ];

  if (representativeUserIds.length === 0) {
    throw new Error("At least one representative user ID is required.");
  }

  const { request, state } = await getVisibleRequestOrThrow(user, token, requestId);
  const userNames = await fetchTeamMemberNames(token);

  for (const existing of state.assignments.filter(
    (item) => item.assignment.serviceRequestId === request.request.id,
  )) {
    const updatedAssignment: ServiceRequestAssignmentRecord = {
      ...existing.assignment,
      decisionNote: input.note?.trim() || existing.assignment.decisionNote,
      status: "client_rejected",
      updatedAt: nowIso(),
    };

    await updateWorkflowNote(token, existing.noteId, {
      assignment: updatedAssignment,
      kind: "assignment",
      schema: "service-request-workflow-v1",
      tenantId: user.tenantId,
    });
  }

  const assignments: ServiceRequestAssignmentRecord[] = [];

  for (const representativeUserId of representativeUserIds) {
    const assignment: ServiceRequestAssignmentRecord = {
      assignedByUserId: user.id,
      createdAt: nowIso(),
      decisionNote: input.note?.trim() || undefined,
      id: createId("assign"),
      representativeName:
        userNames.get(representativeUserId) ?? representativeUserId,
      representativeUserId,
      serviceRequestId: request.request.id,
      status: "pending_client_approval",
      updatedAt: nowIso(),
    };

    assignments.push(assignment);

    await createWorkflowNote(token, request.request.clientId, {
      assignment,
      kind: "assignment",
      schema: "service-request-workflow-v1",
      tenantId: user.tenantId,
    });
  }

  const updatedRequest: ServiceRequestRecord = {
    ...request.request,
    status: "awaiting_client_assignment_approval",
    updatedAt: nowIso(),
  };

  await updateWorkflowNote(token, request.noteId, {
    kind: "request",
    request: updatedRequest,
    schema: "service-request-workflow-v1",
    tenantId: user.tenantId,
  });

  await appendEvent(token, updatedRequest, user, "service_request_assignments_created", {
    note: input.note?.trim() || null,
    representativeUserIds,
  });

  return {
    assignments: assignments.map(clone),
    request: clone(updatedRequest),
  };
};

export const applyLiveServiceRequestClientDecision = async (
  user: IMockUser,
  token: string,
  requestId: string,
  input: {
    assignmentIds: string[];
    decision: "approve" | "reject";
    note?: string;
  },
) => {
  requireClientUser(user);

  const { request, state } = await getVisibleRequestOrThrow(user, token, requestId);
  const assignmentIds = new Set(input.assignmentIds.map((value) => value.trim()).filter(Boolean));
  const matchingAssignments = state.assignments.filter(
    (item) =>
      item.assignment.serviceRequestId === request.request.id &&
      assignmentIds.has(item.assignment.id),
  );

  if (matchingAssignments.length === 0) {
    throw new Error("No matching assignments were found for this request.");
  }

  const nextAssignmentStatus =
    input.decision === "approve" ? "pending_rep_response" : "client_rejected";

  for (const stored of matchingAssignments) {
    const updatedAssignment: ServiceRequestAssignmentRecord = {
      ...stored.assignment,
      decisionNote: input.note?.trim() || stored.assignment.decisionNote,
      status: nextAssignmentStatus,
      updatedAt: nowIso(),
    };

    await updateWorkflowNote(token, stored.noteId, {
      assignment: updatedAssignment,
      kind: "assignment",
      schema: "service-request-workflow-v1",
      tenantId: user.tenantId,
    });
  }

  const updatedRequest: ServiceRequestRecord = {
    ...request.request,
    status:
      input.decision === "approve"
        ? "awaiting_rep_acceptance"
        : "client_rejected_assignment",
    updatedAt: nowIso(),
  };

  await updateWorkflowNote(token, request.noteId, {
    kind: "request",
    request: updatedRequest,
    schema: "service-request-workflow-v1",
    tenantId: user.tenantId,
  });

  await appendEvent(token, updatedRequest, user, "service_request_client_decision", {
    assignmentIds: [...assignmentIds],
    decision: input.decision,
    note: input.note?.trim() || null,
  });

  return clone(updatedRequest);
};

export const applyLiveServiceRequestRepDecision = async (
  user: IMockUser,
  token: string,
  requestId: string,
  input: {
    assignmentId: string;
    decision: "accept" | "reject";
    note?: string;
  },
) => {
  const { request, state } = await getVisibleRequestOrThrow(user, token, requestId);
  const assignment = state.assignments.find(
    (item) =>
      item.assignment.serviceRequestId === request.request.id &&
      item.assignment.id === input.assignmentId,
  );

  if (!assignment) {
    throw new Error("Assignment not found for this request.");
  }

  if (assignment.assignment.representativeUserId !== user.id && user.role !== "Admin") {
    throw new Error("You do not have access to decide this assignment.");
  }

  const updatedAssignment: ServiceRequestAssignmentRecord = {
    ...assignment.assignment,
    decisionNote: input.note?.trim() || assignment.assignment.decisionNote,
    status: input.decision === "accept" ? "rep_accepted" : "rep_rejected",
    updatedAt: nowIso(),
  };

  await updateWorkflowNote(token, assignment.noteId, {
    assignment: updatedAssignment,
    kind: "assignment",
    schema: "service-request-workflow-v1",
    tenantId: user.tenantId,
  });

  const nextState = await loadLiveWorkflowState(user, token);
  const allAssignments = nextState.assignments
    .filter((item) => item.assignment.serviceRequestId === request.request.id)
    .map((item) =>
      item.assignment.id === updatedAssignment.id ? updatedAssignment : item.assignment,
    );
  const hasAccepted = allAssignments.some((item) => item.status === "rep_accepted");
  const hasPending = allAssignments.some((item) => item.status === "pending_rep_response");
  const hasRejected = allAssignments.some((item) => item.status === "rep_rejected");

  const updatedRequest: ServiceRequestRecord = {
    ...request.request,
    status: hasRejected
      ? "rep_rejected_assignment"
      : hasPending
        ? "awaiting_rep_acceptance"
        : hasAccepted
          ? "active"
          : request.request.status,
    updatedAt: nowIso(),
  };

  await updateWorkflowNote(token, request.noteId, {
    kind: "request",
    request: updatedRequest,
    schema: "service-request-workflow-v1",
    tenantId: user.tenantId,
  });

  await appendEvent(token, updatedRequest, user, "service_request_representative_decision", {
    assignmentId: input.assignmentId,
    decision: input.decision,
    note: input.note?.trim() || null,
  });

  return clone(updatedRequest);
};

export const attachLiveOpportunityToServiceRequest = async (
  user: IMockUser,
  token: string,
  requestId: string,
  input: {
    estimatedValue?: number;
    expectedCloseDate?: string;
    mode: "create" | "link";
    opportunityId?: string;
    ownerId?: string;
    stage?: string;
    title?: string;
  },
) => {
  requireInternalUser(user);

  const { request } = await getVisibleRequestOrThrow(user, token, requestId);
  let opportunityId = input.opportunityId?.trim();
  let opportunity: IOpportunity | null = null;

  if (input.mode === "create") {
    const title = input.title?.trim();

    if (!title) {
      throw new Error("title is required when creating an opportunity.");
    }

    opportunity = await createLiveOpportunity(token, {
      clientId: request.request.clientId,
      createdDate: nowIso().split("T")[0],
      currency: "ZAR",
      estimatedValue: Math.max(0, Number(input.estimatedValue ?? 0)),
      expectedCloseDate: normalizeDate(input.expectedCloseDate),
      id: "",
      ownerId: input.ownerId?.trim() || undefined,
      probability: 50,
      source: 1,
      stage: input.stage?.trim() || "Lead",
      title,
      value: Math.max(0, Number(input.estimatedValue ?? 0)),
    } as IOpportunity);
    opportunityId = opportunity.id;
  }

  if (!opportunityId) {
    throw new Error("opportunityId is required when mode is link.");
  }

  const updatedRequest: ServiceRequestRecord = {
    ...request.request,
    opportunityId,
    status: request.request.status === "submitted" ? "under_review" : request.request.status,
    updatedAt: nowIso(),
  };

  await updateWorkflowNote(token, request.noteId, {
    kind: "request",
    request: updatedRequest,
    schema: "service-request-workflow-v1",
    tenantId: user.tenantId,
  });

  await appendEvent(token, updatedRequest, user, "service_request_opportunity_linked", {
    mode: input.mode,
    opportunityId,
  });

  return {
    opportunity,
    request: clone(updatedRequest),
  };
};

export const attachLiveProposalToServiceRequest = async (
  user: IMockUser,
  token: string,
  requestId: string,
  input: {
    currency?: string;
    description?: string;
    mode: "create" | "link";
    proposalId?: string;
    title?: string;
    validUntil?: string;
  },
) => {
  requireInternalUser(user);

  const { request } = await getVisibleRequestOrThrow(user, token, requestId);
  let proposalId = input.proposalId?.trim();
  let proposal: IProposal | null = null;

  if (input.mode === "create") {
    if (!request.request.opportunityId) {
      throw new Error("The service request needs an opportunity before creating a proposal.");
    }

    const title = input.title?.trim();

    if (!title) {
      throw new Error("title is required when creating a proposal.");
    }

    proposal = await createLiveProposal(token, {
      clientId: request.request.clientId,
      currency: input.currency?.trim() || "ZAR",
      description: input.description?.trim() || request.request.description,
      id: "",
      opportunityId: request.request.opportunityId,
      title,
      validUntil: normalizeDate(input.validUntil),
      value: 0,
    } as IProposal);
    proposalId = proposal.id;
  }

  if (!proposalId) {
    throw new Error("proposalId is required when mode is link.");
  }

  const updatedRequest: ServiceRequestRecord = {
    ...request.request,
    proposalId,
    status: "proposal_prepared",
    updatedAt: nowIso(),
  };

  await updateWorkflowNote(token, request.noteId, {
    kind: "request",
    request: updatedRequest,
    schema: "service-request-workflow-v1",
    tenantId: user.tenantId,
  });

  await appendEvent(token, updatedRequest, user, "service_request_proposal_linked", {
    mode: input.mode,
    proposalId,
  });

  return {
    proposal,
    request: clone(updatedRequest),
  };
};
