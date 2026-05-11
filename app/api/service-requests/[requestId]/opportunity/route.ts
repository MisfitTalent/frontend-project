import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { attachOpportunityToServiceRequest } from "@/lib/server/service-request-store";

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
      estimatedValue?: unknown;
      expectedCloseDate?: unknown;
      mode?: unknown;
      opportunityId?: unknown;
      ownerId?: unknown;
      stage?: unknown;
      title?: unknown;
    };

    const result = attachOpportunityToServiceRequest(user, requestId, {
      estimatedValue:
        typeof body.estimatedValue === "number"
          ? body.estimatedValue
          : Number(body.estimatedValue ?? 0),
      expectedCloseDate:
        typeof body.expectedCloseDate === "string" ? body.expectedCloseDate : undefined,
      mode: body.mode === "link" ? "link" : "create",
      opportunityId: typeof body.opportunityId === "string" ? body.opportunityId : undefined,
      ownerId: typeof body.ownerId === "string" ? body.ownerId : undefined,
      stage: typeof body.stage === "string" ? body.stage : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
    });

    return NextResponse.json(result.opportunity);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The opportunity could not be created.";
    const status =
      /not found/i.test(message) ? 404 : /only internal|access/i.test(message) ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}
