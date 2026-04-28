"use client";

import { PageIntro } from "@/components/dashboard/page-intro";
import { PricingRequestsPanel } from "@/components/dashboard/pricing-requests-panel";
import { PricingRequestProvider } from "@/providers/pageProviders";

function PricingRequestsPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <PricingRequestsPanel />
    </div>
  );
}

export default function PricingRequestsPage() {
  return (
    <PricingRequestProvider>
      <PricingRequestsPageContent />
    </PricingRequestProvider>
  );
}
