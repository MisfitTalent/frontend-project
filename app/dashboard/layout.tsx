import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME } from "@/app/api/Auth/session-cookie";
import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { DashboardRouteProviders } from "@/providers/dashboardRouteProviders";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value?.trim();

  if (!sessionToken) {
    redirect("/login");
  }

  return (
    <DashboardFrame>
      <DashboardRouteProviders>{children}</DashboardRouteProviders>
    </DashboardFrame>
  );
}
