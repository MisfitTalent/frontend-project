"use client";

import { Alert, Button, Card, Input, Spin, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

import { getSessionToken } from "@/lib/client/backend-api";
import { clearSessionDraft, readSessionDraft, writeSessionDraft } from "@/lib/client/session-drafts";
import { getAdvisorResponse } from "@/providers/salesSelectors";
import { useDashboardState } from "@/providers/dashboardProvider";
import { AssistantRichText } from "./assistant-rich-text";
import { PRIORITY_ADVISOR_DRAFT_KEY } from "./draft-storage";

const DEFAULT_ADVISOR_PROMPT =
  "Which open sale should I prioritize first today, why, and what should I do next?";

const FOLLOW_UP_PROMPT =
  "What is the best follow-up to do next, and why does it matter?";

const OWNER_PROMPT =
  "Who should own the top priority deal right now, and why?";

const buildAdvisorPrompt = (prompt: string) =>
  `Act as the dashboard sales advisor. Answer briefly and practically using the current workspace only. Include the best recommendation, the reason, and the next action. User request: ${prompt}`;

export function PriorityAdvisor() {
  const { salesData } = useDashboardState();
  const defaultResponse = useMemo(() => getAdvisorResponse(salesData), [salesData]);
  const [prompt, setPrompt] = useState(() => readSessionDraft<string>(PRIORITY_ADVISOR_DRAFT_KEY) ?? "");
  const [response, setResponse] = useState(defaultResponse);
  const [assistantMode, setAssistantMode] = useState<"groq" | "offline" | "openai" | "rules">(
    "rules",
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (prompt) {
      writeSessionDraft(PRIORITY_ADVISOR_DRAFT_KEY, prompt);
      return;
    }

    clearSessionDraft(PRIORITY_ADVISOR_DRAFT_KEY);
  }, [prompt]);

  const requestAdvisor = async (nextPrompt: string) => {
    const trimmedPrompt = nextPrompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = getSessionToken();
      const advisorResponse = await fetch("/api/assistant", {
        body: JSON.stringify({
          messages: [
            {
              content: buildAdvisorPrompt(trimmedPrompt),
              role: "user",
            },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        method: "POST",
      });

      const payload = (await advisorResponse.json()) as {
        message?: string;
        mode?: "groq" | "offline" | "openai";
      };

      if (!advisorResponse.ok) {
        throw new Error(payload.message ?? "The sales advisor could not answer right now.");
      }

      setAssistantMode(payload.mode ?? "rules");
      setResponse(payload.message ?? defaultResponse);
    } catch (requestError) {
      setAssistantMode("rules");
      setResponse(getAdvisorResponse(salesData, trimmedPrompt));
      setError(
        requestError instanceof Error
          ? `${requestError.message} Falling back to local dashboard rules.`
          : "The live sales advisor is unavailable. Falling back to local dashboard rules.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void requestAdvisor(DEFAULT_ADVISOR_PROMPT);
  // Intentionally load once per mount; manual asks should not be overwritten by state churn.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card title="Sales advisor">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Typography.Text className="!text-slate-500">
            Ask for a live recommendation, best follow-up, or the right owner.
          </Typography.Text>
          <Tag color={assistantMode === "rules" ? "#94a3b8" : "#f28c28"}>
            {assistantMode === "rules" ? "Rule-based fallback" : "Live advisor"}
          </Tag>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <Typography.Text strong>Advisor</Typography.Text>
            {isLoading ? <Spin size="small" /> : null}
          </div>
          <AssistantRichText className="!mt-2 text-slate-600" content={response} />
        </div>

        {error ? <Alert description={error} showIcon type="warning" /> : null}

        <Input.TextArea
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask which sale to prioritize, who should own it, or what follow-up to do next."
          rows={3}
          value={prompt}
        />

        <div className="flex flex-wrap gap-3">
          <Button
            loading={isLoading}
            onClick={() => void requestAdvisor(prompt || DEFAULT_ADVISOR_PROMPT)}
            type="primary"
          >
            Ask advisor
          </Button>
          <Button loading={isLoading} onClick={() => void requestAdvisor(FOLLOW_UP_PROMPT)}>
            Best follow-up
          </Button>
          <Button loading={isLoading} onClick={() => void requestAdvisor(OWNER_PROMPT)}>
            Best owner
          </Button>
        </div>
      </div>
    </Card>
  );
}
