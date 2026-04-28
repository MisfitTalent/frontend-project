"use client";

import { ContactsPanel } from "@/components/dashboard/contacts-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ContactProvider } from "@/providers/pageProviders";

function ContactsPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <ContactsPanel />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <ContactProvider>
      <ContactsPageContent />
    </ContactProvider>
  );
}
