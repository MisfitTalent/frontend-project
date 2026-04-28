import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { getAssistantServerConfig } from "@/lib/server/assistant-config";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = getAuthorizedUser(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const config = getAssistantServerConfig();

  return NextResponse.json({
    isConfigured: config.isConfigured,
    mode: config.isConfigured ? config.provider : "offline",
    model: config.model,
    reason: config.reason,
  });
}
