"use client";

import { Card, Progress, Table, Tag } from "antd";

import { getTeamCapacity } from "@/providers/salesSelectors";
import { useDashboardState } from "@/providers/dashboardProvider";

export function TeamCapacityPanel() {
  const { salesData } = useDashboardState();
  const rows = getTeamCapacity(salesData).slice(0, 8);

  return (
    <Card className="dashboard-table-card h-full" title="Available team capacity">
      <Table
        className="dashboard-responsive-table"
        columns={[
          {
            key: "member",
            render: (_, record) => record.member.name,
            title: "Team member",
            width: 180,
          },
          {
            key: "role",
            render: (_, record) => record.member.role,
            title: "Role",
            width: 140,
          },
          {
            key: "assignments",
            render: (assignments: number) => <Tag color="#355c7d">{assignments}</Tag>,
            title: "Live deals",
            dataIndex: "assignments",
            width: 110,
          },
          {
            key: "availableCapacity",
            render: (availableCapacity: number) => (
              <Progress
                percent={Math.max(0, Math.min(100, availableCapacity))}
                showInfo
                strokeColor="#f97316"
              />
            ),
            title: "Availability",
            dataIndex: "availableCapacity",
            width: 220,
          },
        ]}
        dataSource={rows}
        pagination={false}
        rowKey={(record) => record.member.id}
        scroll={{ x: 650 }}
        size="small"
        tableLayout="fixed"
      />
    </Card>
  );
}
