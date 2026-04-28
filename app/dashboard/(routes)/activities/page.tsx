"use client";

import { ActivitiesPanel } from "@/components/dashboard/activities-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ActivityProviderPage } from "@/providers/pageProviders";

function ActivitiesPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <ActivitiesPanel />
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <ActivityProviderPage>
      <ActivitiesPageContent />
    </ActivityProviderPage>
  );
}
