"use client";

import { getSessionToken } from "@/lib/client/backend-api";

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

export type ServiceRequestAssignmentStatus =
  | "pending_client_approval"
  | "client_rejected"
  | "client_approved"
  | "pending_rep_response"
  | "rep_rejected"
  | "rep_accepted";

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
  actorType: "admin" | "assistant" | "client" | "representative" | "workspace_user";
  actorUserId?: string;
  createdAt: string;
  eventType: string;
  id: string;
  payloadJson: Record<string, unknown>;
  serviceRequestId: string;
  tenantId: string;
};

export type ServiceRequestDetail = {
  assignments: ServiceRequestAssignmentRecord[];
  events: WorkflowEventRecord[];
  request: ServiceRequestRecord;
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

const serviceRequestApi = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers);
  const token = getSessionToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
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
      extractErrorMessage(payload) ?? `Request failed with status ${response.status}.`,
    );
  }

  return payload as T;
};

export const listServiceRequests = async (statuses?: ServiceRequestStatus[]) => {
  const params = new URLSearchParams();

  if (statuses && statuses.length > 0) {
    params.set("status", statuses.join(","));
  }

  const path = params.toString()
    ? `/api/service-requests?${params.toString()}`
    : "/api/service-requests";

  const payload = await serviceRequestApi<{ items?: ServiceRequestRecord[] }>(path);
  return payload.items ?? [];
};

export const createServiceRequest = async (payload: {
  clientId: string;
  description: string;
  priority?: ServiceRequestPriority;
  requestType?: string;
  source?: "assistant" | "client_portal" | "workspace";
  title: string;
}) =>
  serviceRequestApi<ServiceRequestRecord>("/api/service-requests", {
    body: JSON.stringify(payload),
    method: "POST",
  });

export const getServiceRequestDetail = async (requestId: string) =>
  serviceRequestApi<ServiceRequestDetail>(`/api/service-requests/${requestId}`);

export const createServiceRequestAssignments = async (
  requestId: string,
  payload: {
    note?: string;
    representativeUserIds: string[];
  },
) =>
  serviceRequestApi<{
    assignments: ServiceRequestAssignmentRecord[];
    request: ServiceRequestRecord;
  }>(`/api/service-requests/${requestId}/assignments`, {
    body: JSON.stringify(payload),
    method: "POST",
  });

export const applyServiceRequestClientDecision = async (
  requestId: string,
  payload: {
    assignmentIds: string[];
    decision: "approve" | "reject";
    note?: string;
  },
) =>
  serviceRequestApi<ServiceRequestDetail>(`/api/service-requests/${requestId}/client-decision`, {
    body: JSON.stringify(payload),
    method: "POST",
  });

export const applyServiceRequestRepresentativeDecision = async (
  requestId: string,
  payload: {
    assignmentId: string;
    decision: "accept" | "reject";
    note?: string;
  },
) =>
  serviceRequestApi<ServiceRequestDetail>(`/api/service-requests/${requestId}/rep-decision`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
