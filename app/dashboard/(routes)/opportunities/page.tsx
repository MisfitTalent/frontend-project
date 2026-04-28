"use client";

import { OpportunitiesPanel } from "@/components/dashboard/opportunities-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { OpportunityProvider } from "@/providers/pageProviders";

function OpportunitiesPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <OpportunitiesPanel />
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <OpportunityProvider>
      <OpportunitiesPageContent />
    </OpportunityProvider>
  );
}
