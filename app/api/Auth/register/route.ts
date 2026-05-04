import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, sanitizeAuthPayload } from "../session-cookie";
import { createBackendUrl } from "@/lib/server/backend-url";
const readJsonBody = async (response: Response) => {
    const text = await response.text();
    if (!text.trim()) {
        return {} as Record<string, unknown>;
    }
    return JSON.parse(text) as Record<string, unknown>;
};
export const POST = async (request: NextRequest) => {
    const upstream = await fetch(createBackendUrl("/api/Auth/register"), {
        body: await request.text(),
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        redirect: "manual",
    });
    const payload = await readJsonBody(upstream);
    const token = typeof payload.token === "string" ? payload.token : "";
    const response = NextResponse.json(sanitizeAuthPayload(payload), { status: upstream.status });
    if (upstream.ok && token) {
        response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    }
    return response;
};
