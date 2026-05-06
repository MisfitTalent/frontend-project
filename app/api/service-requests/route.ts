import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { isLiveSessionToken, getRequestSessionToken } from "@/lib/server/request-session-token";
import {
  createLiveServiceRequest,
  listLiveServiceRequests,
} from "@/lib/server/service-request-backend-store";
import {
  createServiceRequest,
  listServiceRequests,
  type ServiceRequestPriority,
  type ServiceRequestStatus,
} from "@/lib/server/service-request-store";

export const runtime = "nodejs";

const VALID_PRIORITIES = new Set<ServiceRequestPriority>([
  "low",
  "medium",
  "high",
  "critical",
]);

const VALID_STATUSES = new Set<ServiceRequestStatus>([
  "submitted",
  "under_review",
  "proposal_prepared",
  "awaiting_client_assignment_approval",
  "client_rejected_assignment",
  "client_approved_assignment",
  "awaiting_rep_acceptance",
  "rep_rejected_assignment",
  "active",
  "closed",
  "cancelled",
]);

const parseStatuses = (request: NextRequest) => {
  const raw = request.nextUrl.searchParams.get("status")?.trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is ServiceRequestStatus => VALID_STATUSES.has(value as ServiceRequestStatus));
};

export async function GET(request: NextRequest) {
  const user = getAuthorizedUser(request);
  const token = getRequestSessionToken(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const items = isLiveSessionToken(token)
    ? await listLiveServiceRequests(user, token, {
        statuses: parseStatuses(request),
      })
    : listServiceRequests(user, {
        statuses: parseStatuses(request),
      });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const user = getAuthorizedUser(request);
  const token = getRequestSessionToken(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      clientId?: unknown;
      description?: unknown;
      priority?: unknown;
      requestType?: unknown;
      source?: unknown;
      title?: unknown;
    };

    const clientId = String(body.clientId ?? "").trim();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const priority =
      typeof body.priority === "string" && VALID_PRIORITIES.has(body.priority as ServiceRequestPriority)
        ? (body.priority as ServiceRequestPriority)
        : "medium";
    const requestType =
      typeof body.requestType === "string" && body.requestType.trim().length > 0
        ? body.requestType.trim()
        : "service_request";
    const source =
      body.source === "assistant" || body.source === "client_portal" || body.source === "workspace"
        ? body.source
        : undefined;

    if (!clientId || !title || !description) {
      return NextResponse.json(
        {
          message: "clientId, title, and description are required.",
        },
        { status: 400 },
      );
    }

    if (user.role === "Client" && !(user.clientIds ?? []).includes(clientId)) {
      return NextResponse.json(
        {
          message: "Clients can only create requests for their own workspace.",
        },
        { status: 403 },
      );
    }

    const serviceRequest = isLiveSessionToken(token)
      ? await createLiveServiceRequest(user, token, {
          clientId,
          description,
          priority,
          requestType,
          source,
          title,
        })
      : createServiceRequest(user, {
          clientId,
          description,
          priority,
          requestType,
          source,
          title,
        });

    return NextResponse.json(serviceRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "The service request could not be created.",
      },
      { status: 500 },
    );
  }
}
