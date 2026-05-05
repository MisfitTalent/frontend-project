"use client";

import { ClientDashboardOverview } from "@/components/dashboard/client-dashboard-overview";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { PageIntro } from "@/components/dashboard/page-intro";
import { SalesRepDashboardOverview } from "@/components/dashboard/sales-rep-dashboard-overview";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole } from "@/lib/auth/roles";
import { useAuthState } from "@/providers/authProvider";
import { DashboardProvider } from "@/providers/pageProviders";

function DashboardPageContent() {
  const { user } = useAuthState();
  const isScopedClientUser = isClientScopedUser(user?.clientIds);
  const role = getPrimaryUserRole(user?.roles);

  return (
    <div className="space-y-6">
      {isScopedClientUser ? (
        <ClientDashboardOverview />
      ) : role === "SalesRep" ? (
        <SalesRepDashboardOverview />
      ) : (
        <>
          <PageIntro />
          <DashboardMetrics />
        </>
      )}
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
