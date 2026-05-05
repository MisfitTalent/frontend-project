"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Card, Col, Empty, Progress, Row, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useMemo } from "react";

import { AnimatedDashboardTable } from "@/components/dashboard/animated-dashboard-table";
import { useActivityState } from "@/providers/activityProvider";
import { useClientState } from "@/providers/clientProvider";
import { useDashboardState } from "@/providers/dashboardProvider";
import { useNoteState } from "@/providers/noteProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { usePricingRequestState } from "@/providers/pricingRequestProvider";
import { useProposalState } from "@/providers/proposalProvider";
import {
  formatCurrency,
  getDaysUntil,
  getMemberWorkloadProfile,
  getOpportunityInsights,
} from "@/providers/salesSelectors";
import { OPPORTUNITY_STAGE_COLORS, PROPOSAL_STATUS_COLORS, type IActivity, type IClient, type IOpportunity, type IPricingRequest, type IProposal } from "@/providers/salesTypes";

type TeamMemberDetailViewProps = Readonly<{
  memberId: string;
}>;

export function TeamMemberDetailView({ memberId }: TeamMemberDetailViewProps) {
  const { salesData, teamMembers } = useDashboardState();
  const { opportunities } = useOpportunityState();
  const { activities } = useActivityState();
  const { proposals } = useProposalState();
  const { pricingRequests } = usePricingRequestState();
  const { clients } = useClientState();
  const { notes } = useNoteState();

  const member = teamMembers.find((item) => item.id === memberId) ?? null;
  const workload = useMemo(
    () => getMemberWorkloadProfile(salesData, memberId, { pricingRequests }),
    [memberId, pricingRequests, salesData],
  );
  const ownedOpportunities = opportunities.filter((item) => item.ownerId === memberId);
  const openActivities = activities.filter(
    (item) =>
      item.assignedToId === memberId &&
      String(item.status) !== "Completed" &&
      !item.completed,
  );
  const proposalRows = proposals.filter((item) =>
    ownedOpportunities.some((opportunity) => opportunity.id === item.opportunityId),
  );
  const pricingRows = pricingRequests.filter((item) => item.assignedToId === memberId);
  const linkedClientIds = [...new Set(ownedOpportunities.map((item) => item.clientId))];
  const linkedClients = clients.filter((item) => linkedClientIds.includes(item.id));
  const recentMessages = notes.filter(
    (item) =>
      item.representativeId === memberId ||
      (item.clientId ? linkedClientIds.includes(item.clientId) : false),
  );
  const topPriority = getOpportunityInsights(salesData).find(
    (item) => item.opportunity.ownerId === memberId,
  );

  const opportunityColumns: ColumnsType<IOpportunity> = [
    {
      dataIndex: "title",
      key: "title",
      title: "Opportunity",
    },
    {
      key: "client",
      render: (_value, record) =>
        linkedClients.find((client) => client.id === record.clientId)?.name ?? "Unlinked client",
      title: "Client",
    },
    {
      key: "stage",
      render: (_value, record) => (
        <Tag color={OPPORTUNITY_STAGE_COLORS[String(record.stage)] ?? "#94a3b8"}>
          {record.stage}
        </Tag>
      ),
      title: "Stage",
    },
    {
      key: "value",
      render: (_value, record) => formatCurrency(record.value ?? record.estimatedValue),
      title: "Value",
    },
    {
      dataIndex: "expectedCloseDate",
      key: "expectedCloseDate",
      title: "Close date",
    },
  ];

  const activityColumns: ColumnsType<IActivity> = [
    {
      dataIndex: "subject",
      key: "subject",
      title: "Follow-up",
    },
    {
      key: "related",
      render: (_value, record) =>
        opportunities.find((opportunity) => opportunity.id === record.relatedToId)?.title ??
        "General",
      title: "Related deal",
    },
    {
      dataIndex: "dueDate",
      key: "dueDate",
      title: "Due date",
    },
    {
      key: "urgency",
      render: (_value, record) => {
        const days = getDaysUntil(record.dueDate);

        return (
          <Tag color={days < 0 ? "red" : days <= 2 ? "orange" : "blue"}>
            {days < 0 ? "Overdue" : `${days} day${days === 1 ? "" : "s"}`}
          </Tag>
        );
      },
      title: "Urgency",
    },
  ];

  const proposalColumns: ColumnsType<IProposal> = [
    {
      dataIndex: "title",
      key: "title",
      title: "Proposal",
    },
    {
      key: "status",
      render: (_value, record) => (
        <Tag color={PROPOSAL_STATUS_COLORS[String(record.status)] ?? "#94a3b8"}>
          {record.status}
        </Tag>
      ),
      title: "Status",
    },
    {
      key: "value",
      render: (_value, record) => formatCurrency(record.value ?? 0),
      title: "Value",
    },
    {
      dataIndex: "validUntil",
      key: "validUntil",
      title: "Valid until",
    },
  ];

  const pricingColumns: ColumnsType<IPricingRequest> = [
    {
      dataIndex: "title",
      key: "title",
      title: "Pricing request",
    },
    {
      dataIndex: "opportunityTitle",
      key: "opportunityTitle",
      title: "Opportunity",
    },
    {
      dataIndex: "status",
      key: "status",
      title: "Status",
    },
    {
      dataIndex: "requiredByDate",
      key: "requiredByDate",
      title: "Required by",
    },
  ];

  const clientColumns: ColumnsType<IClient> = [
    {
      key: "name",
      render: (_value, record) => (
        <Link
          className="font-medium text-[#1f365c] transition-colors hover:text-[#f28c28]"
          href={`/dashboard/clients/${record.id}`}
        >
          {record.name}
        </Link>
      ),
      title: "Client",
    },
    {
      dataIndex: "industry",
      key: "industry",
      title: "Industry",
    },
    {
      dataIndex: "segment",
      key: "segment",
      title: "Segment",
    },
  ];

  if (!member) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <Empty
          description="This team member could not be found."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Space direction="vertical" size={8}>
        <Link
          className="inline-flex items-center gap-2 font-medium text-[#355c7d] transition-colors hover:text-[#f28c28]"
          href="/dashboard/team-members"
        >
          <ArrowLeftOutlined />
          Back to team
        </Link>
        <div className="space-y-2">
          <Typography.Title className="!mb-0 !text-slate-900" level={2}>
            {member.name}
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 max-w-3xl !text-slate-500">
            {member.role} · {member.region} · {member.skills.join(", ")}
          </Typography.Paragraph>
        </div>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card className="h-full border-slate-200 shadow-sm">
            <Typography.Text className="!text-slate-500">Adjusted capacity</Typography.Text>
            <Typography.Title className="!mb-2 !mt-2" level={3}>
              {workload?.availableCapacity ?? 100}%
            </Typography.Title>
            <Progress percent={workload?.availableCapacity ?? 100} showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="h-full border-slate-200 shadow-sm">
            <Typography.Text className="!text-slate-500">Live opportunities</Typography.Text>
            <Typography.Title className="!mb-1 !mt-2" level={3}>
              {ownedOpportunities.length}
            </Typography.Title>
            <Typography.Text className="!text-slate-500">
              Active commercial work currently owned.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="h-full border-slate-200 shadow-sm">
            <Typography.Text className="!text-slate-500">Open follow-ups</Typography.Text>
            <Typography.Title className="!mb-1 !mt-2" level={3}>
              {openActivities.length}
            </Typography.Title>
            <Typography.Text className="!text-slate-500">
              {workload?.overdueFollowUps ?? 0} overdue.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="h-full border-slate-200 shadow-sm">
            <Typography.Text className="!text-slate-500">Pricing requests</Typography.Text>
            <Typography.Title className="!mb-1 !mt-2" level={3}>
              {pricingRows.length}
            </Typography.Title>
            <Typography.Text className="!text-slate-500">
              {recentMessages.length} linked message{recentMessages.length === 1 ? "" : "s"} in context.
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      {topPriority ? (
        <Card className="border-slate-200 bg-[linear-gradient(135deg,_#eef3f8,_#fff7ed)]">
          <Tag color="#f97316">Top priority owned deal</Tag>
          <Typography.Title className="!mb-1 !mt-2" level={4}>
            {topPriority.opportunity.title}
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !text-slate-600">
            {topPriority.summary}
          </Typography.Paragraph>
        </Card>
      ) : null}

      <Card className="border-slate-200 shadow-sm" title={`Owned opportunities (${ownedOpportunities.length})`}>
        <AnimatedDashboardTable
          columns={opportunityColumns}
          dataSource={ownedOpportunities}
          emptyDescription="No opportunities are assigned to this team member."
          rowKey="id"
          scroll={{ x: 920 }}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="border-slate-200 shadow-sm" title={`Open follow-ups (${openActivities.length})`}>
            <AnimatedDashboardTable
              columns={activityColumns}
              dataSource={openActivities}
              emptyDescription="No open follow-ups are assigned."
              rowKey="id"
              scroll={{ x: 760 }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="border-slate-200 shadow-sm" title={`Linked clients (${linkedClients.length})`}>
            <AnimatedDashboardTable
              columns={clientColumns}
              dataSource={linkedClients}
              emptyDescription="No linked clients found."
              rowKey="id"
              scroll={{ x: 620 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="border-slate-200 shadow-sm" title={`Proposals (${proposalRows.length})`}>
            <AnimatedDashboardTable
              columns={proposalColumns}
              dataSource={proposalRows}
              emptyDescription="No proposals are linked to this team member's opportunities."
              rowKey="id"
              scroll={{ x: 760 }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="border-slate-200 shadow-sm" title={`Pricing requests (${pricingRows.length})`}>
            <AnimatedDashboardTable
              columns={pricingColumns}
              dataSource={pricingRows}
              emptyDescription="No pricing requests are currently assigned."
              rowKey="id"
              scroll={{ x: 760 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
