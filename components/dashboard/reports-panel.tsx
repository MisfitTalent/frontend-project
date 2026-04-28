"use client";

import { Card, Col, Row, Statistic, Table, Tag, Typography } from "antd";

import { OPPORTUNITY_STAGE_COLORS, PROPOSAL_STATUS_COLORS } from "@/providers/salesTypes";
import { formatCurrency } from "@/providers/salesSelectors";
import { useReportState } from "@/providers/reportProvider";
import { useDashboardState } from "@/providers/dashboardProvider";

export function ReportsPanel() {
  const { opportunityInsights, totalPipelineValue, averageDealValue } = useReportState();
  const { salesData } = useDashboardState();

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col span={24} md={8}>
          <Card>
            <Statistic title="Pipeline total" value={totalPipelineValue} prefix="R" precision={0} />
          </Card>
        </Col>
        <Col span={24} md={8}>
          <Card>
            <Statistic title="Ranked opportunities" value={opportunityInsights.length} />
          </Card>
        </Col>
        <Col span={24} md={8}>
          <Card>
            <Statistic title="Average deal size" value={averageDealValue} prefix="R" precision={0} />
          </Card>
        </Col>
      </Row>

      <Card title="Priority report">
        <Table
          columns={[
            {
              key: "opportunity",
              render: (_, record) => record.opportunity.title,
              title: "Opportunity",
            },
            {
              key: "stage",
              render: (_, record) => (
                <Tag color={OPPORTUNITY_STAGE_COLORS[String(record.opportunity.stage)]}>
                  {record.opportunity.stage}
                </Tag>
              ),
              title: "Stage",
            },
            {
              key: "priorityBand",
              render: (_, record) => <Tag color="#f97316">{record.priorityBand}</Tag>,
              title: "Priority",
            },
            {
              key: "score",
              title: "Score",
              dataIndex: "score",
            },
            {
              key: "owner",
              render: (_, record) => record.owner?.name ?? "Auto-pick pending",
              title: "Owner",
            },
            {
              key: "value",
              render: (_, record) =>
                formatCurrency(
                  record.opportunity.value ?? record.opportunity.estimatedValue,
                ),
              title: "Value",
            },
          ]}
          dataSource={opportunityInsights}
          pagination={false}
          rowKey={(record) => record.opportunity.id}
        />
      </Card>

      <Card title="Proposal status summary">
        <div className="flex flex-wrap gap-3">
          {Object.entries(
            salesData.proposals.reduce<Record<string, number>>((accumulator, proposal) => {
              const status = String(proposal.status);
              accumulator[status] = (accumulator[status] ?? 0) + 1;
              return accumulator;
            }, {}),
          ).map(([status, count]) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" key={status}>
              <Tag color={PROPOSAL_STATUS_COLORS[status]}>{status}</Tag>
              <Typography.Paragraph className="!mb-0 !mt-2 !text-slate-500">
                {count} proposal{count === 1 ? "" : "s"}
              </Typography.Paragraph>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
