import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { getRequestSessionToken, isLiveSessionToken } from "@/lib/server/request-session-token";
import { applyLiveServiceRequestRepDecision } from "@/lib/server/service-request-backend-store";
import { applyServiceRequestRepDecision } from "@/lib/server/service-request-store";

export const runtime = "nodejs";

export async function POST(
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
    const body = (await request.json()) as {
      assignmentId?: unknown;
      decision?: unknown;
      note?: unknown;
    };

    if (body.decision !== "accept" && body.decision !== "reject") {
      return NextResponse.json(
        { message: "decision must be accept or reject." },
        { status: 400 },
      );
    }

    const payload = {
      assignmentId: typeof body.assignmentId === "string" ? body.assignmentId : "",
      decision: body.decision as "accept" | "reject",
      note: typeof body.note === "string" ? body.note : undefined,
    };
    const updated = isLiveSessionToken(token)
      ? await applyLiveServiceRequestRepDecision(user, token, requestId, payload)
      : applyServiceRequestRepDecision(user, requestId, payload);

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The representative decision could not be applied.";
    const status = /not found/i.test(message) ? 404 : /access/i.test(message) ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}
