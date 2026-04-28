"use client";

import { DocumentsPanel } from "@/components/dashboard/documents-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { DocumentProvider } from "@/providers/pageProviders";

function DocumentsPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <DocumentsPanel />
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <DocumentProvider>
      <DocumentsPageContent />
    </DocumentProvider>
  );
}
