"use client";

import { Alert, Button, Card, Input, Spin, Tag, Typography } from "antd";
import {
  DeleteOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole, getUserRoleLabel, isManagerRole } from "@/lib/auth/roles";
import { getSessionToken } from "@/lib/client/backend-api";
import { clearSessionDraft, readSessionDraft, writeSessionDraft } from "@/lib/client/session-drafts";
import { useAuthState } from "@/providers/authProvider";
import type { UserRole } from "@/providers/salesTypes";
import {
  ASSISTANT_PANEL_DRAFT_KEY,
  ASSISTANT_PANEL_MESSAGES_KEY,
  getScopedDraftKey,
} from "./draft-storage";
import { AssistantRichText } from "./assistant-rich-text";

type AssistantMessage = {
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

type AssistantRuntimeMode =
  | "groq"
  | "local"
  | "offline"
  | "openai"
  | "workflow"
  | null;

const MAX_VISIBLE_MESSAGES = 12;

const getIntroMessage = (role: UserRole, isScopedClientUser: boolean) =>
  isScopedClientUser
    ? "I can help with your shared client workspace, proposals, documents, messages, and the next best step with the account team."
    : isManagerRole(role)
      ? "I can help with pipeline risk, next actions, proposal bottlenecks, renewal risk, workload pressure, pending client requests, workspace search, and creating or deleting clients, opportunities, draft proposals, activities, pricing requests, and notes when you ask explicitly."
      : "I can help with your assigned opportunities, proposal progress, pricing requests, activities, workspace search, and creating or deleting clients, opportunities, draft proposals, activities, pricing requests, and notes when you ask explicitly.";

const getModeTag = (mode: AssistantRuntimeMode) => {
  if (mode === "offline") {
    return { color: "gold", label: "Offline guidance" };
  }

  if (mode === "workflow") {
    return { color: "blue", label: "Workflow automation" };
  }

  if (mode === "local") {
    return { color: "cyan", label: "Local guidance" };
  }

  return { color: "green", label: "Live assistant" };
};

const getResponseStatusLabel = (mode: AssistantRuntimeMode, scopeLabel?: string) => {
  if (mode === "offline") {
    return "Offline workspace guidance active";
  }

  if (mode === "workflow") {
    return "Workflow completed locally";
  }

  if (mode === "local") {
    return "Local workspace guidance active";
  }

  return scopeLabel ?? "Secure access ready";
};

export function AssistantPanel() {
  const { user } = useAuthState();
  const role = getPrimaryUserRole(user?.roles);
  const isScopedClientUser = isClientScopedUser(user?.clientIds);
  const draftStorageKey = getScopedDraftKey(ASSISTANT_PANEL_DRAFT_KEY, {
    tenantId: user?.tenantId,
    userId: user?.userId,
  });
  const messageStorageKey = getScopedDraftKey(ASSISTANT_PANEL_MESSAGES_KEY, {
    tenantId: user?.tenantId,
    userId: user?.userId,
  });
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [assistantMode, setAssistantMode] = useState<AssistantRuntimeMode>(null);
  const [assistantReason, setAssistantReason] = useState<string | null>(null);
  const [lastResponseReason, setLastResponseReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [loadedStorageIdentity, setLoadedStorageIdentity] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState("Awaiting your question");
  const storageIdentity = `${draftStorageKey}::${messageStorageKey}`;
  const modeTag = getModeTag(assistantMode);
  const scopeTagLabel = isScopedClientUser
    ? "Client scope"
    : isManagerRole(role)
      ? "Manager scope"
      : `${getUserRoleLabel(role)} scope`;

  const resetConversation = () => {
    setDraft("");
    setMessages([]);
    setError(null);
    setLastResponseReason(null);
    clearSessionDraft(draftStorageKey);
    clearSessionDraft(messageStorageKey);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDraft(readSessionDraft<string>(draftStorageKey) ?? "");
      setMessages(readSessionDraft<AssistantMessage[]>(messageStorageKey) ?? []);
      setError(null);
      setLastResponseReason(null);
      setLoadedStorageIdentity(storageIdentity);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draftStorageKey, messageStorageKey, storageIdentity]);

  const suggestedPrompts =
    isScopedClientUser
        ? [
            "What is the latest proposal status for my account?",
            "Summarize the latest messages with the account team.",
            "What documents or contracts need my attention?",
            "Send a message to my representative saying we are ready to proceed.",
          ]
        : role === "SalesRep"
        ? [
            "What assigned work needs my attention first?",
            "Which pricing request or proposal is blocked?",
            "Summarize my pipeline in plain language.",
            "Create a new opportunity for an existing client.",
            "Create a draft proposal for an existing opportunity.",
            "Delete the client or proposal I just created.",
          ]
        : [
            "Which deals need action first this week?",
            "Where is the biggest renewal risk right now?",
            "Who looks overloaded and what should I reassign?",
            "What client requests are waiting for admin review?",
            "Review the latest client request and recommend the right reps.",
            "Create a new opportunity for an existing client.",
            "Create a draft proposal for an existing opportunity.",
            "Delete the client or proposal I just created.",
            "Search the workspace for a client, proposal, or contract.",
        ];

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

  useEffect(() => {
    let isActive = true;

    const loadAssistantStatus = async () => {
      try {
        const token = getSessionToken();
        const response = await fetch("/api/assistant/status", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const payload = (await response.json()) as {
          isConfigured?: boolean;
          message?: string;
          mode?: "groq" | "offline" | "openai";
          model?: string;
          reason?: string | null;
        };

        if (!response.ok || !isActive) {
          if (isActive) {
            setAssistantMode("offline");
            setAssistantReason(
              payload.reason ?? payload.message ?? "Assistant access is not authorized.",
            );
            setStatusLabel("Assistant access unavailable");
          }
          return;
        }

        setAssistantMode(payload.mode ?? null);
        setAssistantReason(payload.reason ?? null);
        setStatusLabel(
          payload.mode === "offline"
            ? "Offline mode available"
            : "Secure access ready",
        );
      } catch {
        if (!isActive) {
          return;
        }

        setAssistantMode("offline");
        setAssistantReason("Assistant status could not be verified.");
        setStatusLabel("Offline secure mode - status unavailable");
      }
    };

    void loadAssistantStatus();

    return () => {
      isActive = false;
    };
  }, []);

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();

    if (!trimmed || isSubmitting) {
      return;
    }

    const nextMessages = [
      ...messages,
      {
        content: trimmed,
        role: "user" as const,
      },
    ].slice(-MAX_VISIBLE_MESSAGES);

    setMessages(nextMessages);
    setDraft("");
    clearSessionDraft(draftStorageKey);
    setError(null);
    setLastResponseReason(null);
    setIsSubmitting(true);

    try {
      const token = getSessionToken();
      const response = await fetch("/api/assistant", {
        body: JSON.stringify({ messages: nextMessages }),
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        method: "POST",
      });

      const payload = (await response.json()) as {
        message?: string;
        mode?: AssistantRuntimeMode;
        model?: string;
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
        reason?: string | null;
        scopeLabel?: string;
        trace?: Array<{
          arguments: Record<string, unknown>;
          outputPreview: string;
          tool: string;
        }>;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "The assistant request failed.");
      }

      setAssistantMode(payload.mode ?? null);
      setLastResponseReason(payload.reason ?? null);
      setMessages((current) =>
        [
          ...current,
          {
            content: payload.message ?? "No assistant response was returned.",
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
      setStatusLabel(getResponseStatusLabel(payload.mode ?? null, payload.scopeLabel));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The assistant could not process this request.",
      );
      setLastResponseReason(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="min-w-0 border-slate-200">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <RobotOutlined className="text-slate-600" />
                <Typography.Title className="!mb-0 !text-slate-900" level={4}>
                  Secure sales assistant
                </Typography.Title>
              </div>
              <Typography.Text className="block !text-slate-500">
                {statusLabel}
              </Typography.Text>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tag color={modeTag.color}>{modeTag.label}</Tag>
              <Tag color={isManagerRole(role) ? "#f28c28" : "#4f7cac"}>{scopeTagLabel}</Tag>
            </div>
          </div>

          {assistantMode === "offline" && lastResponseReason ? (
            <Alert
              className="mb-4"
              description={lastResponseReason}
              showIcon
              title="Live assistant unavailable for this response"
              type="warning"
            />
          ) : null}

          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-4 text-slate-700">
                <AssistantRichText
                  className="text-slate-700"
                  content={getIntroMessage(role, isScopedClientUser)}
                />
              </div>
            ) : null}

            {messages.map((message, index) => (
              <div
                className={`rounded-3xl p-4 ${
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
                {message.role === "assistant" && message.trace?.length ? (
                  <details className="mt-3 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-600">
                    <summary className="cursor-pointer font-medium text-slate-700">
                      View assistant trace
                    </summary>
                    <div className="mt-3 space-y-3">
                      {message.trace.map((step, stepIndex) => (
                        <div
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                          key={`${step.tool}-${stepIndex}`}
                        >
                          <Typography.Text strong>{step.tool}</Typography.Text>
                          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-600">
                            {JSON.stringify(step.arguments, null, 2)}
                          </pre>
                          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-500">
                            {step.outputPreview}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            ))}

            {isSubmitting ? (
              <div className="flex items-center gap-3 rounded-3xl bg-slate-50 p-4 text-slate-500">
                <Spin size="small" />
                <span>Reviewing authorized workspace data...</span>
              </div>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <Button key={prompt} onClick={() => void sendMessage(prompt)}>
                  {prompt}
                </Button>
              ))}
            </div>

            <Input.TextArea
              onChange={(event) => setDraft(event.target.value)}
              onPressEnter={(event) => {
                if (!event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(draft);
                }
              }}
              placeholder="Ask for pipeline advice, account status, follow-ups, workspace search, or ask me to create or delete clients, opportunities, proposals, activities, pricing requests, or notes."
              rows={4}
              value={draft}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={messages.length === 0 && !draft}
                  icon={<DeleteOutlined />}
                  onClick={resetConversation}
                >
                  Reset chat
                </Button>
                <Button
                  icon={<SendOutlined />}
                  loading={isSubmitting}
                  onClick={() => void sendMessage(draft)}
                  type="primary"
                >
                  Send
                </Button>
              </div>
            </div>

            {error ? <Alert description={error} showIcon title="Assistant request failed." type="error" /> : null}
          </div>
        </Card>

        <div className="space-y-4">
          {assistantMode === "offline" ? (
            <Alert
              showIcon
              title="Live assistant is not configured yet."
              type="warning"
              description={
                assistantReason
                  ? `${assistantReason} Add it to .env.local and restart the Next.js server.`
                  : "Add OPENAI_API_KEY or GROQ_API_KEY to .env.local and restart the Next.js server."
              }
            />
          ) : null}

          <Card className="border-slate-200">
            <div className="flex items-start gap-3">
              <SafetyCertificateOutlined className="mt-1 text-[#f28c28]" />
              <div className="space-y-2">
                <Typography.Title className="!mb-0" level={5}>
                  Security posture
                </Typography.Title>
                <Typography.Paragraph className="!mb-0 !text-slate-600">
                  Every assistant request is authorized on the server using your bearer token before any data is exposed to the model.
                </Typography.Paragraph>
                <Typography.Paragraph className="!mb-0 !text-slate-600">
                  Responses are constrained by your tenant and your role, with manager-focused or contributor-focused guidance depending on your permissions.
                </Typography.Paragraph>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200" title="What You Can Ask">
            <div className="space-y-3 text-sm text-slate-600">
              <p>Pipeline priority and next actions</p>
              <p>Proposal status and blockers</p>
              <p>Renewal risk and deadline pressure</p>
              <p>Follow-ups, workload pressure, and role-appropriate business summaries</p>
              <p>Workspace search across clients, opportunities, proposals, contracts, notes, documents, pricing requests, and renewals</p>
              <p>Create or delete clients, opportunities, draft proposals, activities, pricing requests, and notes when you provide enough detail</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
