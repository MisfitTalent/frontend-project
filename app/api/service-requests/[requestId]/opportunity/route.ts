import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { getRequestSessionToken, isLiveSessionToken } from "@/lib/server/request-session-token";
import { attachLiveOpportunityToServiceRequest } from "@/lib/server/service-request-backend-store";
import { attachOpportunityToServiceRequest } from "@/lib/server/service-request-store";

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
      estimatedValue?: unknown;
      expectedCloseDate?: unknown;
      mode?: unknown;
      opportunityId?: unknown;
      ownerId?: unknown;
      stage?: unknown;
      title?: unknown;
    };

    const payload = {
      estimatedValue:
        typeof body.estimatedValue === "number"
          ? body.estimatedValue
          : Number(body.estimatedValue ?? 0),
      expectedCloseDate:
        typeof body.expectedCloseDate === "string" ? body.expectedCloseDate : undefined,
      mode: (body.mode === "link" ? "link" : "create") as "create" | "link",
      opportunityId: typeof body.opportunityId === "string" ? body.opportunityId : undefined,
      ownerId: typeof body.ownerId === "string" ? body.ownerId : undefined,
      stage: typeof body.stage === "string" ? body.stage : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
    };
    const result = isLiveSessionToken(token)
      ? await attachLiveOpportunityToServiceRequest(user, token, requestId, payload)
      : attachOpportunityToServiceRequest(user, requestId, payload);

    return NextResponse.json(result.opportunity);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The opportunity could not be created.";
    const status =
      /not found/i.test(message) ? 404 : /only internal|access/i.test(message) ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}
