"use client";

import { PageIntro } from "@/components/dashboard/page-intro";
import { ReportsPanel } from "@/components/dashboard/reports-panel";
import { ReportProvider } from "@/providers/pageProviders";

function ReportsPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <ReportsPanel />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ReportProvider>
      <ReportsPageContent />
    </ReportProvider>
  );
}
