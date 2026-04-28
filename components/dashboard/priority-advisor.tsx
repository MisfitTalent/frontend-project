"use client";

import { Button, Card, Input, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

import { clearSessionDraft, readSessionDraft, writeSessionDraft } from "@/lib/client/session-drafts";
import { getAdvisorResponse } from "@/providers/salesSelectors";
import { useDashboardState } from "@/providers/dashboardProvider";
import { PRIORITY_ADVISOR_DRAFT_KEY } from "./draft-storage";

export function PriorityAdvisor() {
  const { salesData } = useDashboardState();
  const defaultResponse = useMemo(() => getAdvisorResponse(salesData), [salesData]);
  const [prompt, setPrompt] = useState(() => readSessionDraft<string>(PRIORITY_ADVISOR_DRAFT_KEY) ?? "");
  const [response, setResponse] = useState(defaultResponse);

  useEffect(() => {
    if (prompt) {
      writeSessionDraft(PRIORITY_ADVISOR_DRAFT_KEY, prompt);
      return;
    }

    clearSessionDraft(PRIORITY_ADVISOR_DRAFT_KEY);
  }, [prompt]);

  return (
    <Card title="Sales advisor">
      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <Typography.Text strong>Advisor</Typography.Text>
          <Typography.Paragraph className="!mb-0 !mt-2 !text-slate-600">
            {response}
          </Typography.Paragraph>
        </div>

        <Input.TextArea
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask which sale to prioritize, who should own it, or what follow-up to do next."
          rows={3}
          value={prompt}
        />

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setResponse(getAdvisorResponse(salesData, prompt))} type="primary">
            Ask advisor
          </Button>
          <Button onClick={() => setResponse(getAdvisorResponse(salesData, "follow up"))}>
            Best follow-up
          </Button>
          <Button onClick={() => setResponse(getAdvisorResponse(salesData, "assign owner"))}>
            Best owner
          </Button>
        </div>
      </div>
    </Card>
  );
}
