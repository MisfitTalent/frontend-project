import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { getRequestSessionToken, isLiveSessionToken } from "@/lib/server/request-session-token";
import {
  deleteLiveServiceRequest,
  getLiveServiceRequestDetail,
  updateLiveServiceRequest,
} from "@/lib/server/service-request-backend-store";
import {
  deleteServiceRequest,
  getServiceRequestDetail,
  type ServiceRequestPriority,
  updateServiceRequest,
} from "@/lib/server/service-request-store";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> },
) {
  const user = await getAuthorizedUser(request);
  const token = getRequestSessionToken(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { requestId } = await context.params;
    const detail = isLiveSessionToken(token)
      ? await getLiveServiceRequestDetail(user, token, requestId)
      : getServiceRequestDetail(user, requestId);
    return NextResponse.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The service request could not be loaded.";
    const status = /not found/i.test(message) ? 404 : /access/i.test(message) ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}

const VALID_PRIORITIES = new Set<ServiceRequestPriority>([
  "low",
  "medium",
  "high",
  "critical",
]);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> },
) {
  const user = await getAuthorizedUser(request);
  const token = getRequestSessionToken(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { requestId } = await context.params;
    const body = (await request.json()) as {
      description?: unknown;
      priority?: unknown;
      requestType?: unknown;
      title?: unknown;
    };

    const detail = isLiveSessionToken(token)
      ? await updateLiveServiceRequest(user, token, requestId, {
          description: typeof body.description === "string" ? body.description : undefined,
          priority:
            typeof body.priority === "string" && VALID_PRIORITIES.has(body.priority as ServiceRequestPriority)
              ? (body.priority as ServiceRequestPriority)
              : undefined,
          requestType: typeof body.requestType === "string" ? body.requestType : undefined,
          title: typeof body.title === "string" ? body.title : undefined,
        })
      : updateServiceRequest(user, requestId, {
          description: typeof body.description === "string" ? body.description : undefined,
          priority:
            typeof body.priority === "string" && VALID_PRIORITIES.has(body.priority as ServiceRequestPriority)
              ? (body.priority as ServiceRequestPriority)
              : undefined,
          requestType: typeof body.requestType === "string" ? body.requestType : undefined,
          title: typeof body.title === "string" ? body.title : undefined,
        });

    return NextResponse.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The service request could not be updated.";
    const status =
      /not found/i.test(message) ? 404 : /access|unauthorized|only/i.test(message) ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> },
) {
  const user = await getAuthorizedUser(request);
  const token = getRequestSessionToken(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { requestId } = await context.params;
    const deleted = isLiveSessionToken(token)
      ? await deleteLiveServiceRequest(user, token, requestId)
      : deleteServiceRequest(user, requestId);
    return NextResponse.json(deleted);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The service request could not be deleted.";
    const status =
      /not found/i.test(message) ? 404 : /access|unauthorized|only/i.test(message) ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}
