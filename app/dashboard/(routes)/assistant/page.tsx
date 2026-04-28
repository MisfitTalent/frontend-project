"use client";

import { AssistantPanel } from "@/components/dashboard/assistant-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { AssistantProvider } from "@/providers/pageProviders";

function AssistantPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <AssistantPanel />
    </div>
  );
}

export default function AssistantPage() {
  return (
    <AssistantProvider>
      <AssistantPageContent />
    </AssistantProvider>
  );
}
