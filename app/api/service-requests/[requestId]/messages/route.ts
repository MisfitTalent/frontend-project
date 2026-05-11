import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { getRequestSessionToken, isLiveSessionToken } from "@/lib/server/request-session-token";
import { addLiveServiceRequestMessage } from "@/lib/server/service-request-backend-store";
import { addServiceRequestMessage } from "@/lib/server/service-request-store";
import type { ServiceRequestMessageRecipientType } from "@/lib/client/service-request-api";

export const runtime = "nodejs";

export async function POST(
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
      content?: unknown;
      recipientType?: unknown;
      representativeUserIds?: unknown;
    };

    const payload = {
      content: typeof body.content === "string" ? body.content : "",
      recipientType:
        body.recipientType === "client" ||
        body.recipientType === "representative" ||
        body.recipientType === "both"
          ? (body.recipientType as ServiceRequestMessageRecipientType)
          : "client",
      representativeUserIds: Array.isArray(body.representativeUserIds)
        ? body.representativeUserIds.filter(
            (value): value is string => typeof value === "string" && value.trim().length > 0,
          )
        : [],
    };

    const result = isLiveSessionToken(token)
      ? await addLiveServiceRequestMessage(user, token, requestId, payload)
      : addServiceRequestMessage(user, requestId, payload);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The service request reply could not be added.";
    const status =
      /not found/i.test(message) ? 404 : /access|unauthorized|only/i.test(message) ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}
