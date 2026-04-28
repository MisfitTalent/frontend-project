import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "../session-cookie";
import { createBackendUrl } from "@/lib/server/backend-url";

const readJsonBody = async (response: Response) => {
  const text = await response.text();

  if (!text.trim()) {
    return {} as Record<string, unknown>;
  }

  return JSON.parse(text) as Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  const upstream = await fetch(createBackendUrl("/api/Auth/register"), {
    body: await request.text(),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    redirect: "manual",
  });
  const payload = await readJsonBody(upstream);
  const response = NextResponse.json(payload, { status: upstream.status });

  const token = typeof payload.token === "string" ? payload.token : "";

  if (upstream.ok && token) {
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
  }

  return response;
}
