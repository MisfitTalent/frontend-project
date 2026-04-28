"use client";

import { Card, Table, Tag, Typography } from "antd";

import { PRIORITY_BAND_COLORS, type PriorityBand } from "@/providers/salesTypes";
import { formatCurrency, getOpportunityInsights } from "@/providers/salesSelectors";
import { useDashboardState } from "@/providers/dashboardProvider";

type OpportunityPriorityQueueProps = {
  limit?: number;
};

export function OpportunityPriorityQueue({
  limit = 5,
}: OpportunityPriorityQueueProps) {
  const { salesData } = useDashboardState();
  const insights = getOpportunityInsights(salesData).slice(0, limit);

  return (
    <Card
      className="dashboard-table-card h-full"
      title="Priority queue"
      extra={
        <Typography.Text className="block max-w-full !text-slate-500">
          Ranked by money and deadline pressure
        </Typography.Text>
      }
    >
      <Table
        className="dashboard-responsive-table"
        columns={[
          {
            dataIndex: ["opportunity", "title"],
            key: "opportunity",
            title: "Opportunity",
            width: 220,
          },
          {
            key: "client",
            render: (record) => record.client?.name ?? "Unassigned client",
            title: "Client",
            width: 180,
          },
          {
            key: "priorityBand",
            render: (priorityBand: PriorityBand) => (
              <Tag color={PRIORITY_BAND_COLORS[priorityBand]}>{priorityBand}</Tag>
            ),
            title: "Priority",
            dataIndex: "priorityBand",
            width: 120,
          },
          {
            key: "score",
            title: "Score",
            dataIndex: "score",
            width: 90,
          },
          {
            key: "value",
            render: (_, record) =>
              formatCurrency(
                record.opportunity.value ?? record.opportunity.estimatedValue,
              ),
            title: "Value",
            width: 130,
          },
          {
            key: "daysToClose",
            render: (daysToClose: number) =>
              daysToClose <= 0 ? "Past due" : `${daysToClose} days`,
            title: "Deadline",
            dataIndex: "daysToClose",
            width: 120,
          },
          {
            key: "owner",
            render: (_, record) => record.owner?.name ?? "Auto-pick pending",
            title: "Owner",
            width: 170,
          },
        ]}
        dataSource={insights}
        pagination={false}
        rowKey={(record) => record.opportunity.id}
        scroll={{ x: 1030 }}
        size="small"
        tableLayout="fixed"
      />
    </Card>
  );
}
