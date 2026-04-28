"use client";

import { ClientsPanel } from "@/components/dashboard/clients-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ClientProvider } from "@/providers/pageProviders";

function ClientsPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <ClientsPanel />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <ClientProvider>
      <ClientsPageContent />
    </ClientProvider>
  );
}
