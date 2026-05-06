import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { getRequestSessionToken, isLiveSessionToken } from "@/lib/server/request-session-token";
import { getLiveServiceRequestDetail } from "@/lib/server/service-request-backend-store";
import { getServiceRequestDetail } from "@/lib/server/service-request-store";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> },
) {
  const user = getAuthorizedUser(request);
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
