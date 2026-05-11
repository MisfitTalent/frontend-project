import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { createServiceRequestAssignments } from "@/lib/server/service-request-store";

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
      note?: unknown;
      representativeUserIds?: unknown;
    };

    const representativeUserIds = Array.isArray(body.representativeUserIds)
      ? body.representativeUserIds
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

    const result = createServiceRequestAssignments(user, requestId, {
      note: typeof body.note === "string" ? body.note : undefined,
      representativeUserIds,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The assignments could not be created.";
    const status =
      /not found/i.test(message) ? 404 : /only internal|access/i.test(message) ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}
