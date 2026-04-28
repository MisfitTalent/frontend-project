import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { PageIntro } from "@/components/dashboard/page-intro";
import { DashboardProvider } from "@/providers/pageProviders";

function DashboardPageContent() {
  return (
    <div className="space-y-6">
      <PageIntro />
      <DashboardMetrics />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardPageContent />
    </DashboardProvider>
  );
}
