"use client";

import { Card, Col, Row, Skeleton } from "antd";
import dynamic from "next/dynamic";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole } from "@/lib/auth/roles";
import { useAuthState } from "@/providers/authProvider";

const ClientDashboardOverview = dynamic(
  () =>
    import("@/components/dashboard/client-dashboard-overview").then(
      (mod) => mod.ClientDashboardOverview,
    ),
  {
    loading: () => <DashboardHomeLoading />,
  },
);

const DashboardMetrics = dynamic(
  () => import("@/components/dashboard/dashboard-metrics").then((mod) => mod.DashboardMetrics),
  {
    loading: () => <DashboardHomeLoading />,
  },
);

const SalesRepDashboardOverview = dynamic(
  () =>
    import("@/components/dashboard/sales-rep-dashboard-overview").then(
      (mod) => mod.SalesRepDashboardOverview,
    ),
  {
    loading: () => <DashboardHomeLoading />,
  },
);

function DashboardHomeLoading() {
  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Col key={index} xs={24} sm={12} xl={6}>
            <Card className="h-full border-slate-200">
              <Skeleton active paragraph={{ rows: 2 }} title={{ width: "55%" }} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card className="border-slate-200">
        <Skeleton active paragraph={{ rows: 6 }} title={{ width: "35%" }} />
      </Card>
    </div>
  );
}

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
        <DashboardMetrics />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardPageContent />;
}
