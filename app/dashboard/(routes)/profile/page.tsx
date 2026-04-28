"use client";

import { PageIntro } from "@/components/dashboard/page-intro";
import { ProfilePanel } from "@/components/dashboard/profile-panel";
import { ProfileProvider } from "@/providers/pageProviders";

function ProfilePageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <ProfilePanel />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProfileProvider>
      <ProfilePageContent />
    </ProfileProvider>
  );
}
