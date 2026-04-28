import { NextRequest, NextResponse } from "next/server";

import { getAuthorizedUser } from "@/lib/server/assistant-auth";
import {
  type AssistantMutation,
  runSecureAssistant,
  type AssistantMessage,
  type AssistantTraceStep,
} from "@/lib/server/assistant-openai";
import { getAssistantWorkspaceForUser } from "@/lib/server/assistant-workspace";

export const runtime = "nodejs";

const MAX_MESSAGE_COUNT = 12;
const MAX_MESSAGE_LENGTH = 2000;

const parseMessages = (value: unknown): AssistantMessage[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("messages must be a non-empty array.");
  }

  return value
    .slice(-MAX_MESSAGE_COUNT)
    .map((message) => {
      if (!message || typeof message !== "object") {
        throw new Error("Each message must be an object.");
      }

      const role =
        (message as { role?: unknown }).role === "assistant" ? "assistant" : "user";
      const content = String((message as { content?: unknown }).content ?? "").trim();

      if (!content) {
        throw new Error("Message content is required.");
      }

      return {
        content: content.slice(0, MAX_MESSAGE_LENGTH),
        role,
      };
    });
};

const sanitizeTrace = (trace: AssistantTraceStep[] | undefined) =>
  Array.isArray(trace) ? trace.slice(0, 8) : [];

const sanitizeMutations = (mutations: AssistantMutation[] | undefined) =>
  Array.isArray(mutations) ? mutations.slice(0, 8) : [];

export async function POST(request: NextRequest) {
  const user = getAuthorizedUser(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const messages = parseMessages(body.messages);
    const latestMessage = messages[messages.length - 1];

    if (latestMessage.role !== "user") {
      return NextResponse.json(
        { message: "The latest assistant request must end with a user message." },
        { status: 400 },
      );
    }

    const workspace = getAssistantWorkspaceForUser(user);
    const result = await runSecureAssistant({ messages, workspace });

    return NextResponse.json({
      message: result.message,
      mode: result.mode,
      model: result.model,
      mutations: sanitizeMutations(result.mutations),
      role: workspace.role,
      scopeLabel: workspace.scopeLabel,
      trace: sanitizeTrace(result.trace),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "The assistant could not process this request.",
      },
      { status: 500 },
    );
  }
}
