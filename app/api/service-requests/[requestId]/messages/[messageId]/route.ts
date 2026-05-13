import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { getRequestSessionToken, isLiveSessionToken } from "@/lib/server/request-session-token";
import {
  deleteLiveServiceRequestMessage,
  updateLiveServiceRequestMessage,
} from "@/lib/server/service-request-backend-store";
import {
  deleteServiceRequestMessage,
  updateServiceRequestMessage,
} from "@/lib/server/service-request-store";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ messageId: string; requestId: string }> },
) {
  const user = await getAuthorizedUser(request);
  const token = getRequestSessionToken(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messageId, requestId } = await context.params;
    const body = (await request.json()) as {
      content?: unknown;
    };

    const content = typeof body.content === "string" ? body.content : "";
    const detail = isLiveSessionToken(token)
      ? await updateLiveServiceRequestMessage(user, token, requestId, messageId, {
          content,
        })
      : updateServiceRequestMessage(user, requestId, messageId, {
          content,
        });

    return NextResponse.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The service request message could not be updated.";
    const status =
      /not found/i.test(message) ? 404 : /access|unauthorized|only/i.test(message) ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ messageId: string; requestId: string }> },
) {
  const user = await getAuthorizedUser(request);
  const token = getRequestSessionToken(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messageId, requestId } = await context.params;
    const detail = isLiveSessionToken(token)
      ? await deleteLiveServiceRequestMessage(user, token, requestId, messageId)
      : deleteServiceRequestMessage(user, requestId, messageId);

    return NextResponse.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The service request message could not be deleted.";
    const status =
      /not found/i.test(message) ? 404 : /access|unauthorized|only/i.test(message) ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}
