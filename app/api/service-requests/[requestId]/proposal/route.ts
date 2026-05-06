import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { getRequestSessionToken, isLiveSessionToken } from "@/lib/server/request-session-token";
import { attachLiveProposalToServiceRequest } from "@/lib/server/service-request-backend-store";
import { attachProposalToServiceRequest } from "@/lib/server/service-request-store";

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
      currency?: unknown;
      description?: unknown;
      mode?: unknown;
      proposalId?: unknown;
      title?: unknown;
      validUntil?: unknown;
    };

    const payload = {
      currency: typeof body.currency === "string" ? body.currency : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      mode: (body.mode === "link" ? "link" : "create") as "create" | "link",
      proposalId: typeof body.proposalId === "string" ? body.proposalId : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
      validUntil: typeof body.validUntil === "string" ? body.validUntil : undefined,
    };
    const result = isLiveSessionToken(token)
      ? await attachLiveProposalToServiceRequest(user, token, requestId, payload)
      : attachProposalToServiceRequest(user, requestId, payload);

    return NextResponse.json(result.proposal);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The proposal could not be created.";
    const status =
      /not found/i.test(message) ? 404 : /only internal|access/i.test(message) ? 403 : 400;
    return NextResponse.json({ message }, { status });
  }
}
