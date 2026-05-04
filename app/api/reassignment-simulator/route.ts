import { NextRequest, NextResponse } from "next/server";
import { isManagerRole } from "@/lib/auth/roles";
import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import { analyzeReassignmentScenario } from "@/lib/server/reassignment-simulator";
import type { IReassignmentSimulationRequest } from "@/types/reassignment";
export const runtime = "nodejs";
const isValidRequest = (value: unknown): value is IReassignmentSimulationRequest => {
    if (!value || typeof value !== "object") {
        return false;
    }
    const payload = value as Partial<IReassignmentSimulationRequest>;
    return (Array.isArray(payload.opportunityIds) &&
        typeof payload.targetOwnerId === "string" &&
        payload.targetOwnerId.trim().length > 0 &&
        Boolean(payload.salesData) &&
        typeof payload.salesData === "object");
};
export const POST = async (request: NextRequest) => {
    const user = await getAuthorizedUser(request);
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!isManagerRole(user.role)) {
        return NextResponse.json({ message: "Only admins and sales managers can run the reassignment simulator." }, { status: 403 });
    }
    try {
        const body = await request.json();
        if (!isValidRequest(body)) {
            return NextResponse.json({ message: "Invalid reassignment simulator payload." }, { status: 400 });
        }
        const result = await analyzeReassignmentScenario(body);
        return NextResponse.json(result);
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({
            message: error instanceof Error
                ? error.message
                : "The reassignment simulator could not process this request.",
        }, { status: 500 });
    }
};
