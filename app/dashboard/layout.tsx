import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { DashboardRouteProviders } from "@/providers/dashboardRouteProviders";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardFrame>
      <DashboardRouteProviders>{children}</DashboardRouteProviders>
    </DashboardFrame>
  );
}
