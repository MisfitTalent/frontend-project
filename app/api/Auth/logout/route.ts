import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "../session-cookie";
export const POST = async () => {
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, "", {
        ...AUTH_COOKIE_OPTIONS,
        maxAge: 0,
    });
    return response;
};
