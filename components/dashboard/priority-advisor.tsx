"use client";

import { DeleteOutlined, SendOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Input, Spin, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

import { getSessionToken } from "@/lib/client/backend-api";
import { clearSessionDraft, readSessionDraft, writeSessionDraft } from "@/lib/client/session-drafts";
import { useAuthState } from "@/providers/authProvider";
import { getAdvisorResponse } from "@/providers/salesSelectors";
import { useDashboardState } from "@/providers/dashboardProvider";
import { AssistantRichText } from "./assistant-rich-text";
import {
  PRIORITY_ADVISOR_DRAFT_KEY,
  PRIORITY_ADVISOR_MESSAGES_KEY,
  getScopedDraftKey,
} from "./draft-storage";

const DEFAULT_ADVISOR_PROMPT =
  "Which open sale should I prioritize first today, why, and what should I do next?";

const FOLLOW_UP_PROMPT =
  "What is the best follow-up to do next, and why does it matter?";

const OWNER_PROMPT =
  "Who should own the top priority deal right now, and why?";

type AdvisorAction = "ask" | "follow-up" | "owner";
type AdvisorMessage = {
  content: string;
  mutations?: Array<{
    entityId: string;
    entityType:
      | "activity"
      | "client"
      | "note"
      | "opportunity"
      | "pricing_request"
      | "proposal";
    operation: "create" | "delete" | "update";
    record?: Record<string, unknown>;
    title: string;
  }>;
  role: "assistant" | "user";
  trace?: Array<{
    arguments: Record<string, unknown>;
    outputPreview: string;
    tool: string;
  }>;
};
const MAX_VISIBLE_MESSAGES = 24;

const GREETING_PROMPTS = new Set([
  "hello",
  "hello there",
  "hey",
  "hey there",
  "hi",
  "hi there",
]);

const CONFIRMATION_PROMPTS = new Set([
  "confirm",
  "confirmed",
  "yes",
  "yeah",
  "yep",
  "go ahead",
  "proceed",
  "do it",
  "do so",
  "do that",
  "yes please",
  "sure",
  "sure thing",
  "make it happen",
  "apply it",
  "apply that",
  "approved",
  "okay",
  "ok",
]);

const ADVISOR_INTENT_KEYWORDS = [
  "action",
  "activity",
  "again",
  "also",
  "another",
  "assign",
  "batch",
  "client",
  "close",
  "continue",
  "deal",
  "follow",
  "keep",
  "more",
  "next",
  "opportunity",
  "other",
  "owner",
  "pipeline",
  "priorit",
  "proposal",
  "remaining",
  "renewal",
  "repeat",
  "rest",
  "sale",
  "same",
  "task",
  "too",
  "work",
];

const buildAdvisorPrompt = (prompt: string) =>
  `Act as the dashboard sales advisor. Answer briefly and practically using the current workspace only. Include the best recommendation, the reason, and the next action. User request: ${prompt}`;

const normalizePrompt = (prompt: string) =>
  prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getAdvisorClarification = (prompt: string) => {
  const normalizedPrompt = normalizePrompt(prompt);

  if (CONFIRMATION_PROMPTS.has(normalizedPrompt)) {
    return null;
  }

  if (GREETING_PROMPTS.has(normalizedPrompt)) {
    return "Hi. Ask me which deal to prioritize, what follow-up to do next, or who should own the top opportunity.";
  }

  const promptWords = normalizedPrompt.split(" ").filter(Boolean);
  const hasAdvisorIntent = ADVISOR_INTENT_KEYWORDS.some((keyword) =>
    normalizedPrompt.includes(keyword),
  );

  if (promptWords.length <= 2 && !hasAdvisorIntent) {
    return "Ask a sales question such as which deal to prioritize, what follow-up to do next, or who should own the top opportunity.";
  }

  return null;
};

export function PriorityAdvisor() {
  const { user } = useAuthState();
  const { salesData } = useDashboardState();
  const defaultResponse = useMemo(() => getAdvisorResponse(salesData), [salesData]);
  const draftStorageKey = getScopedDraftKey(PRIORITY_ADVISOR_DRAFT_KEY, {
    tenantId: user?.tenantId,
    userId: user?.userId,
  });
  const messageStorageKey = getScopedDraftKey(PRIORITY_ADVISOR_MESSAGES_KEY, {
    tenantId: user?.tenantId,
    userId: user?.userId,
  });
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [loadedStorageIdentity, setLoadedStorageIdentity] = useState<string | null>(null);
  const [assistantMode, setAssistantMode] = useState<"groq" | "offline" | "openai" | "rules" | "workflow">(
    "rules",
  );
  const [assistantReason, setAssistantReason] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<AdvisorAction>("ask");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusLabel, setStatusLabel] = useState("Awaiting your question");
  const storageIdentity = `${draftStorageKey}::${messageStorageKey}`;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDraft(readSessionDraft<string>(draftStorageKey) ?? "");
      setMessages(readSessionDraft<AdvisorMessage[]>(messageStorageKey) ?? []);
      setError(null);
      setAssistantReason(null);
      setLoadedStorageIdentity(storageIdentity);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draftStorageKey, messageStorageKey, storageIdentity]);

  const fallbackPrompt = messages
    .slice()
    .reverse()
    .find((message) => message.role === "user")?.content;

  const introMessage = useMemo(() => {
    if (!fallbackPrompt) {
      return defaultResponse;
    }

    const clarification = getAdvisorClarification(fallbackPrompt);

    if (clarification) {
      return clarification;
    }

    return getAdvisorResponse(salesData, fallbackPrompt);
  }, [defaultResponse, fallbackPrompt, salesData]);

  useEffect(() => {
    if (loadedStorageIdentity !== storageIdentity) {
      return;
    }

    if (draft) {
      writeSessionDraft(draftStorageKey, draft);
      return;
    }

    clearSessionDraft(draftStorageKey);
  }, [draft, draftStorageKey, loadedStorageIdentity, storageIdentity]);

  useEffect(() => {
    if (loadedStorageIdentity !== storageIdentity) {
      return;
    }

    if (messages.length > 0) {
      writeSessionDraft(messageStorageKey, messages);
      return;
    }

    clearSessionDraft(messageStorageKey);
  }, [loadedStorageIdentity, messageStorageKey, messages, storageIdentity]);

  const resetConversation = () => {
    setDraft("");
    setMessages([]);
    setError(null);
    setAssistantMode("rules");
    setAssistantReason(null);
    setActiveAction("ask");
    setStatusLabel("Awaiting your question");
    clearSessionDraft(draftStorageKey);
    clearSessionDraft(messageStorageKey);
  };

  const requestAdvisor = async (nextPrompt: string) => {
    const trimmedPrompt = nextPrompt.trim();

    if (!trimmedPrompt || isLoading) {
      return;
    }

    const clarification = getAdvisorClarification(trimmedPrompt);
    const nextMessages = [
      ...messages,
      {
        content: trimmedPrompt,
        role: "user" as const,
      },
    ].slice(-MAX_VISIBLE_MESSAGES);

    setMessages(nextMessages);
    setDraft("");
    clearSessionDraft(draftStorageKey);
    setError(null);

    if (clarification) {
      setAssistantMode("rules");
      setMessages((current) =>
        [
          ...current,
          {
            content: clarification,
            role: "assistant" as const,
          },
        ].slice(-MAX_VISIBLE_MESSAGES),
      );
      setStatusLabel("Rule-based guidance");
      return;
    }

    setIsLoading(true);

    try {
      const token = getSessionToken();
      const advisorResponse = await fetch("/api/assistant", {
        body: JSON.stringify({
          messages: nextMessages.map((message) =>
            message.role === "user"
              ? {
                  content: buildAdvisorPrompt(message.content),
                  role: "user" as const,
                }
              : message,
          ),
        }),
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        method: "POST",
      });

      const payload = (await advisorResponse.json()) as {
        message?: string;
        mutations?: AdvisorMessage["mutations"];
        mode?: "groq" | "offline" | "openai" | "workflow";
        reason?: string | null;
        trace?: AdvisorMessage["trace"];
      };

      if (!advisorResponse.ok) {
        throw new Error(payload.message ?? "The sales advisor could not answer right now.");
      }

      setAssistantMode(payload.mode ?? "rules");
      setAssistantReason(payload.reason ?? null);
      setMessages((current) =>
        [
          ...current,
          {
            content: payload.message ?? defaultResponse,
            mutations: payload.mutations ?? [],
            role: "assistant" as const,
            trace: payload.trace ?? [],
          },
        ].slice(-MAX_VISIBLE_MESSAGES),
      );
      if ((payload.mutations?.length ?? 0) > 0) {
        window.dispatchEvent(
          new CustomEvent("mock-workspace-updated", {
            detail: payload.mutations,
          }),
        );
      }
      setStatusLabel(
        payload.mode === "offline" ? "Offline workspace guidance active" : "Live advisor ready",
      );
    } catch (requestError) {
      setAssistantMode("rules");
      setAssistantReason(null);
      setMessages((current) =>
        [
          ...current,
          {
            content: getAdvisorResponse(salesData, trimmedPrompt),
            role: "assistant" as const,
          },
        ].slice(-MAX_VISIBLE_MESSAGES),
      );
      setError(
        requestError instanceof Error
          ? `${requestError.message} Falling back to local dashboard rules.`
          : "The live sales advisor is unavailable. Falling back to local dashboard rules.",
      );
      setStatusLabel("Rule-based guidance");
    } finally {
      setIsLoading(false);
    }
  };

  const submitTypedPrompt = () => {
    setActiveAction("ask");
    void requestAdvisor(draft || DEFAULT_ADVISOR_PROMPT);
  };

  return (
    <Card title="Sales advisor">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Typography.Text className="block !text-slate-500">
              Ask for a live recommendation, best follow-up, or the right owner.
            </Typography.Text>
            <Typography.Text className="block !text-slate-400">
              {statusLabel}
            </Typography.Text>
          </div>
          <Tag color={assistantMode === "rules" ? "#94a3b8" : "#f28c28"}>
            {assistantMode === "offline"
              ? "Offline guidance"
              : assistantMode === "workflow"
                ? "Workflow automation"
              : assistantMode === "rules"
                ? "Rule-based fallback"
                : "Live advisor"}
          </Tag>
        </div>

        {assistantMode === "offline" && assistantReason ? (
          <Alert
            description={assistantReason}
            showIcon
            title="Live advisor unavailable for this response"
            type="warning"
          />
        ) : null}

        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4">
              <Typography.Text strong>Advisor</Typography.Text>
              <AssistantRichText className="!mt-2 text-slate-600" content={introMessage} />
            </div>
          ) : null}

          {messages.map((message, index) => (
            <div
              className={`rounded-2xl p-4 ${
                message.role === "assistant"
                  ? "bg-slate-50 text-slate-700"
                  : "bg-[#1f365c] text-white"
              }`}
              key={`${message.role}-${index}`}
            >
              <AssistantRichText
                className={message.role === "assistant" ? "text-slate-700" : "text-white"}
                content={message.content}
              />
            </div>
          ))}

          {isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-slate-500">
              <Spin size="small" />
              <span>Reviewing workspace context...</span>
            </div>
          ) : null}
        </div>

        {error ? <Alert description={error} showIcon type="warning" /> : null}

        <Input.TextArea
          onChange={(event) => setDraft(event.target.value)}
          onPressEnter={(event) => {
            if (!event.shiftKey) {
              event.preventDefault();
              submitTypedPrompt();
            }
          }}
          placeholder="Ask which sale to prioritize, who should own it, or what follow-up to do next."
          rows={3}
          value={draft}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Typography.Text className="!text-slate-500">
            Press Enter to send. Use Shift+Enter for a new line.
          </Typography.Text>

          <div className="flex flex-wrap gap-3">
          <Button
            icon={<SendOutlined />}
            loading={isLoading}
            onClick={submitTypedPrompt}
            type={activeAction === "ask" ? "primary" : "default"}
          >
            {draft.trim().length > 0 ? "Submit question" : "Ask advisor"}
          </Button>
          <Button
            loading={isLoading}
            onClick={() => {
              setActiveAction("follow-up");
              void requestAdvisor(FOLLOW_UP_PROMPT);
            }}
            type={activeAction === "follow-up" ? "primary" : "default"}
          >
            Best follow-up
          </Button>
          <Button
            loading={isLoading}
            onClick={() => {
              setActiveAction("owner");
              void requestAdvisor(OWNER_PROMPT);
            }}
            type={activeAction === "owner" ? "primary" : "default"}
          >
            Best owner
          </Button>
          <Button
            disabled={messages.length === 0 && !draft}
            icon={<DeleteOutlined />}
            onClick={resetConversation}
          >
            Reset chat
          </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
