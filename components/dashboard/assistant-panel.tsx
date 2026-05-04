"use client";

import { Alert, Button, Card, Input, Spin, Tag, Typography } from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import Link from "next/link";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole, getUserRoleLabel, isManagerRole } from "@/lib/auth/roles";
import { clearSessionDraft, readSessionDraft, writeSessionDraft } from "@/lib/client/session-drafts";
import { useAuthState } from "@/providers/authProvider";
import type { UserRole } from "@/providers/salesTypes";
import { ASSISTANT_PANEL_DRAFT_KEY, ASSISTANT_PANEL_MESSAGES_KEY } from "./draft-storage";
import { AssistantRichText } from "./assistant-rich-text";
import { useStyles } from "./assistant-panel.styles";

type AssistantMessage = {
  content: string;
  mutations?: Array<{
    entityId: string;
    entityType: "activity" | "client" | "opportunity" | "pricing_request" | "proposal";
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

type AssistantMutation = NonNullable<AssistantMessage["mutations"]>[number];

const MAX_VISIBLE_MESSAGES = 12;

const getMutationRoute = (entityType: AssistantMutation["entityType"]) => {
  switch (entityType) {
    case "activity":
      return "/dashboard/activities";
    case "pricing_request":
      return "/dashboard/proposals";
    case "proposal":
      return "/dashboard/proposals";
    case "client":
      return "/dashboard/clients";
    case "opportunity":
    default:
      return "/dashboard/clients";
  }
};

const getMutationOutcome = (
  mutation: AssistantMutation,
  isClientPortal: boolean,
) => {
  const route = getMutationRoute(mutation.entityType);

  if (!isClientPortal) {
    return {
      description: mutation.operation === "delete" ? "Workspace record removed." : "Workspace record updated.",
      route,
      title: mutation.title,
    };
  }

  switch (mutation.entityType) {
    case "activity":
      return {
        description:
          mutation.operation === "create"
            ? "A meeting or walkthrough request is now visible in your Meetings area."
            : "Your meeting request was updated.",
        route,
        title: mutation.title || "Meeting request updated",
      };
    case "pricing_request":
      return {
        description:
          mutation.operation === "create"
            ? "Your commercial request was submitted to the account team."
            : "Your commercial request was updated.",
        route,
        title: mutation.title || "Commercial request updated",
      };
    case "proposal":
      return {
        description: "The commercial record was updated. Review it in your Commercials area.",
        route,
        title: mutation.title || "Commercial record updated",
      };
    default:
      return {
        description: mutation.operation === "delete" ? "The request was removed." : "The request was recorded.",
        route,
        title: mutation.title,
      };
  }
};

const getIntroMessage = (role: UserRole, isClientPortal: boolean) =>
  isClientPortal
    ? "Tell me what you want to achieve, what you are evaluating, your timing, or what kind of commercial guidance you need. I can help you think through proposals, meetings, documents, the next client-facing step, and I can submit meeting or commercial requests when you ask explicitly."
    : isManagerRole(role)
      ? "I can help with pipeline risk, next actions, proposal bottlenecks, renewal risk, workload pressure, workspace search, and creating clients, opportunities, and draft proposals or deleting opportunities and draft proposals when you ask explicitly."
      : "I can help with your assigned opportunities, proposal progress, pricing requests, activities, workspace search, and creating or deleting opportunities and draft proposals when you ask explicitly.";

export const AssistantPanel=() =>{
  const { user } = useAuthState();
  const role = getPrimaryUserRole(user?.roles);
  const isClientPortal = isClientScopedUser(user?.clientIds);
  const { styles } = useStyles();
  const [draft, setDraft] = useState(() => readSessionDraft<string>(ASSISTANT_PANEL_DRAFT_KEY) ?? "");
  const [error, setError] = useState<string | null>(null);
  const [assistantMode, setAssistantMode] = useState<"groq" | "offline" | "openai" | null>(null);
  const [assistantReason, setAssistantReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [statusLabel, setStatusLabel] = useState("Awaiting your question");

  const resetConversation = () => {
    setDraft("");
    setMessages([]);
    setError(null);
    clearSessionDraft(ASSISTANT_PANEL_DRAFT_KEY);
    clearSessionDraft(ASSISTANT_PANEL_MESSAGES_KEY);
  };

  const suggestedPrompts =
    isClientPortal
      ? [
          "Our goal is to roll this out quickly. What should we clarify first?",
          "Help me understand which proposal best fits our needs.",
          "Request a proposal walkthrough with our representative.",
          "Submit a commercial request for revised pricing.",
          "What information should we prepare before the next meeting?",
          "Summarize the current commercial status for our account.",
          "What should we ask the representative before we decide?",
        ]
      : role === "SalesRep"
      ? [
          "What assigned work needs my attention first?",
          "Which pricing request or proposal is blocked?",
          "Summarize my pipeline in plain language.",
          "Create a new opportunity for an existing client.",
          "Create a draft proposal for an existing opportunity.",
          "Delete a proposal or opportunity I no longer need.",
        ]
      : [
          "Which deals need action first this week?",
          "Where is the biggest renewal risk right now?",
          "Who looks overloaded and what should I reassign?",
          "Create a new opportunity for an existing client.",
          "Create a draft proposal for an existing opportunity.",
          "Delete a proposal or opportunity I no longer need.",
          "Search the workspace for a client, proposal, or contract.",
      ];

  useEffect(() => {
    if (draft) {
      writeSessionDraft(ASSISTANT_PANEL_DRAFT_KEY, draft);
      return;
    }

    clearSessionDraft(ASSISTANT_PANEL_DRAFT_KEY);
  }, [draft]);

  useEffect(() => {
    clearSessionDraft(ASSISTANT_PANEL_MESSAGES_KEY);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadAssistantStatus = async () => {
      try {
        const response = await fetch("/api/assistant/status");
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
    clearSessionDraft(ASSISTANT_PANEL_DRAFT_KEY);
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/assistant", {
        body: JSON.stringify({ messages: nextMessages }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const payload = (await response.json()) as {
        message?: string;
        mode?: string;
        model?: string;
        mutations?: Array<{
          entityId: string;
          entityType: "activity" | "client" | "opportunity" | "pricing_request" | "proposal";
          operation: "create" | "delete" | "update";
          record?: Record<string, unknown>;
          title: string;
        }>;
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
      setStatusLabel(
        payload.mode === "offline"
          ? "Offline mode available"
          : payload.scopeLabel ?? "Secure access ready",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The assistant could not process this request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <Card className={styles.assistantCard}>
          <div className={styles.header}>
            <div className={styles.headerCopy}>
              <div className={styles.headerRow}>
                <RobotOutlined className={styles.mutedText} />
                <Typography.Title className={styles.title} level={4}>
                  {isClientPortal ? "Client advisor" : "Secure sales assistant"}
                </Typography.Title>
              </div>
              <Typography.Text className={styles.panelText}>
                {statusLabel}
              </Typography.Text>
            </div>
            <Tag color={isClientPortal ? "orange" : isManagerRole(role) ? "orange" : "blue"}>
              {isClientPortal
                ? "Client account scope"
                : isManagerRole(role)
                  ? "Manager scope"
                  : `${getUserRoleLabel(role)} scope`}
            </Tag>
          </div>

          <div className={styles.messageContainer}>
            {messages.length === 0 ? (
              <div className={styles.emptyMessage}>
                <AssistantRichText
                  className={styles.introText}
                  content={getIntroMessage(role, isClientPortal)}
                />
              </div>
            ) : null}

            {messages.map((message, index) => (
              <div
                className={message.role === "assistant" ? styles.assistantMessage : styles.userMessage}
                key={`${message.role}-${index}`}
              >
                <AssistantRichText
                  className={message.role === "assistant" ? styles.assistantText : styles.userText}
                  content={message.content}
                />
                {message.role === "assistant" && message.mutations?.length ? (
                  <div className={styles.messageBlock}>
                    {message.mutations.map((mutation, mutationIndex) => {
                      const outcome = getMutationOutcome(mutation, isClientPortal);

                      return (
                        <div
                          className={styles.mutationCard}
                          key={`${mutation.entityType}-${mutation.entityId}-${mutationIndex}`}
                        >
                          <div className={styles.mutationHeader}>
                            <div className={styles.mutationInfo}>
                              <CheckCircleOutlined className={styles.statusIcon} />
                              <div className={styles.mutationCopy}>
                                <Typography.Text className={styles.title}>
                                  {outcome.title}
                                </Typography.Text>
                                <Typography.Text className={styles.mutationText}>
                                  {outcome.description}
                                </Typography.Text>
                              </div>
                            </div>
                            <Link
                              className={styles.link}
                              href={outcome.route}
                            >
                              Open
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                {message.role === "assistant" && message.trace?.length && !isClientPortal ? (
                  <details className={styles.traceDetails}>
                    <summary className={styles.traceSummary}>
                      View assistant trace
                    </summary>
                    <div className={styles.messageBlock}>
                      {message.trace.map((step, stepIndex) => (
                        <div
                          className={styles.traceCard}
                          key={`${step.tool}-${stepIndex}`}
                        >
                          <Typography.Text strong>{step.tool}</Typography.Text>
                          <pre className={styles.tracePre}>
                            {JSON.stringify(step.arguments, null, 2)}
                          </pre>
                          <pre className={styles.tracePreMuted}>
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
              <div className={styles.assistantMessage}>
                <div className={styles.headerRow}>
                  <Spin size="small" />
                  <span>Reviewing authorized workspace data...</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.submitRow}>
            <Input.TextArea
              onChange={(event) => setDraft(event.target.value)}
              onPressEnter={(event) => {
                if (!event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(draft);
                }
              }}
              placeholder={
                isClientPortal
                  ? "Tell me your goals, what you are evaluating, what outcome you want, or ask me to request a meeting, walkthrough, or commercial follow-up for you."
                  : "Ask for pipeline advice, account status, follow-ups, workspace search, or ask me to create a client, opportunity, or draft proposal, or delete an opportunity or draft proposal."
              }
              rows={4}
              value={draft}
            />

            <div className={styles.actionBar}>
              <div className={styles.suggestionList}>
                {suggestedPrompts.map((prompt) => (
                  <Button key={prompt} onClick={() => void sendMessage(prompt)}>
                    {prompt}
                  </Button>
                ))}
              </div>
              <div className={styles.actionGroup}>
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

        <div className={styles.rightColumn}>
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

          <Card className={styles.helperCard}>
            <div className={styles.helperCardBody}>
              <SafetyCertificateOutlined className={styles.statusIcon} />
              <div className={styles.helperCopy}>
                <Typography.Title className={styles.title} level={5}>
                  {isClientPortal ? "Client-safe guidance" : "Security posture"}
                </Typography.Title>
                <Typography.Paragraph className={styles.helperText}>
                  {isClientPortal
                    ? "Your questions are answered using only the records visible to your account in this client workspace."
                    : "Every assistant request is authorized on the server using your bearer token before any data is exposed to the model."}
                </Typography.Paragraph>
                <Typography.Paragraph className={styles.helperText}>
                  {isClientPortal
                    ? "The advisor is intended to help you clarify goals, understand your commercial status, and prepare for the next conversation."
                    : "Responses are constrained by your tenant and your role, with manager-focused or contributor-focused guidance depending on your permissions."}
                </Typography.Paragraph>
              </div>
            </div>
          </Card>

          <Card className={styles.helperCard} title="What You Can Ask">
            <div className={styles.helperList}>
              {isClientPortal ? (
                <>
                  <p>Your goals, desired outcomes, and evaluation questions</p>
                  <p>Proposal status, current commercials, and what to clarify next</p>
                  <p>Meeting preparation, document requests, and account questions</p>
                  <p>Request a meeting, proposal walkthrough, or commercial follow-up</p>
                  <p>Guidance on what to ask your representative before deciding</p>
                </>
              ) : (
                <>
                  <p>Pipeline priority and next actions</p>
                  <p>Proposal status and blockers</p>
                  <p>Renewal risk and deadline pressure</p>
                  <p>Follow-ups, workload pressure, and role-appropriate business summaries</p>
                  <p>Workspace search across clients, opportunities, proposals, contracts, notes, documents, pricing requests, and renewals</p>
                  <p>Create a client, opportunity, or draft proposal, or delete an opportunity or draft proposal, when you provide enough detail</p>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
