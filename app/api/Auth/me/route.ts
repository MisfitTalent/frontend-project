import { NextRequest, NextResponse } from "next/server";
import type { AuthSessionUser } from "@/lib/auth/auth-contract";
import { toAuthPayload } from "../mock-users";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, sanitizeAuthPayload } from "../session-cookie";
import { createBackendUrl } from "@/lib/server/backend-url";
import { getUserFromSessionToken } from "@/lib/auth/session-user";
export const GET = async (request: NextRequest) => {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim() || cookieToken || "";
    const mockUser = token ? getUserFromSessionToken(token) : null;
    if (mockUser && token.startsWith("mock-token::")) {
        return NextResponse.json(sanitizeAuthPayload(toAuthPayload(mockUser)), { status: 200 });
    }
    const headers = new Headers();
    if (authHeader) {
        headers.set("authorization", authHeader);
    }
    else if (cookieToken) {
        headers.set("authorization", `Bearer ${cookieToken}`);
    }
    const upstream = await fetch(createBackendUrl("/api/Auth/me"), {
        headers,
        method: "GET",
        redirect: "manual",
    });
    const payload = upstream.status === 204 ? null : ((await upstream.json()) as AuthSessionUser | null);
    const response = NextResponse.json(payload ? sanitizeAuthPayload(payload) : null, { status: upstream.status });
    if (upstream.status === 401) {
        response.cookies.set(AUTH_COOKIE_NAME, "", {
            ...AUTH_COOKIE_OPTIONS,
            maxAge: 0,
        });
    }
    return response;
};
