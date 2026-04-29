"use client";

import { PageIntro } from "@/components/dashboard/page-intro";
import { TeamMembersPanel } from "@/components/dashboard/team-members-panel";
import { TeamProvider } from "@/providers/pageProviders";

function TeamMembersPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <TeamMembersPanel />
    </div>
  );
}

export default function TeamMembersPage() {
  return (
    <TeamProvider>
      <TeamMembersPageContent />
    </TeamProvider>
  );
}
