"use client";

import { PageIntro } from "@/components/dashboard/page-intro";
import { ProposalsPanel } from "@/components/dashboard/proposals-panel";
import { ProposalProvider } from "@/providers/pageProviders";

function ProposalsPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <ProposalsPanel />
    </div>
  );
}

export default function ProposalsPage() {
  return (
    <ProposalProvider>
      <ProposalsPageContent />
    </ProposalProvider>
  );
}
