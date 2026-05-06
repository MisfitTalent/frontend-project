import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { applyServiceRequestClientDecision } from "@/lib/server/service-request-store";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> },
) {
  const user = getAuthorizedUser(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { requestId } = await context.params;
    const body = (await request.json()) as {
      assignmentIds?: unknown;
      decision?: unknown;
      note?: unknown;
    };

    const assignmentIds = Array.isArray(body.assignmentIds)
      ? body.assignmentIds.filter((value): value is string => typeof value === "string")
      : [];

    if (body.decision !== "approve" && body.decision !== "reject") {
      return NextResponse.json(
        { message: "decision must be approve or reject." },
        { status: 400 },
      );
    }

    const updated = applyServiceRequestClientDecision(user, requestId, {
      assignmentIds,
      decision: body.decision,
      note: typeof body.note === "string" ? body.note : undefined,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The client decision could not be applied.";
    const status =
      /not found/i.test(message) ? 404 : /only client|access/i.test(message) ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}
