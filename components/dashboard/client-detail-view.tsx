"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Card, Col, Descriptions, Empty, Row, Skeleton, Space, Tag, Typography } from "antd";
import Link from "next/link";

import { useClientState } from "@/providers/clientProvider";
import { useContractState } from "@/providers/contractProvider";
import { useDashboardState } from "@/providers/dashboardProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { useProposalState } from "@/providers/proposalProvider";
import {
  formatCurrency,
  getDaysUntil,
  getOpportunityInsights,
} from "@/providers/salesSelectors";
import {
  OPPORTUNITY_STAGE_COLORS,
  PROPOSAL_STATUS_COLORS,
  type IOpportunity,
  type IProposal,
} from "@/providers/salesTypes";
import { AnimatedDashboardTable } from "./animated-dashboard-table";

type ClientDetailViewProps = Readonly<{
  clientId: string;
}>;

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const { clients } = useClientState();
  const { proposals } = useProposalState();
  const { opportunities } = useOpportunityState();
  const { contracts } = useContractState();
  const { salesData, teamMembers } = useDashboardState();

  const client = clients.find((item) => item.id === clientId);
  const clientOpportunities = opportunities.filter((opportunity) => opportunity.clientId === clientId);
  const clientProposals = proposals.filter((proposal) => proposal.clientId === clientId);
  const clientContracts = contracts.filter((contract) => contract.clientId === clientId);
  const opportunityInsights = getOpportunityInsights(salesData).filter(
    (insight) => insight.opportunity.clientId === clientId,
  );
  const insightByOpportunityId = new Map(
    opportunityInsights.map((insight) => [insight.opportunity.id, insight]),
  );
  const topPriority = opportunityInsights[0];
  const openPipelineValue = clientOpportunities
    .filter((opportunity) => !["Won", "Lost"].includes(String(opportunity.stage)))
    .reduce(
      (sum, opportunity) => sum + (opportunity.value ?? opportunity.estimatedValue),
      0,
    );

  if (!client && clients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton.Button active block className="!h-6 !w-40" />
          <Skeleton active paragraph={{ rows: 1 }} title={{ width: "40%" }} />
        </div>
        <Card className="border-slate-200 shadow-sm">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <Link
          className="inline-flex items-center gap-2 font-medium text-[#355c7d] transition-colors hover:text-[#f28c28]"
          href="/dashboard/clients"
        >
          <ArrowLeftOutlined />
          Back to clients
        </Link>
        <Card className="border-slate-200 shadow-sm">
          <Empty
            description="This client record could not be found."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      </div>
    );
  }

  const opportunityColumns = [
    {
      dataIndex: "title",
      key: "title",
      title: "Opportunity",
    },
    {
      key: "priority",
      render: (_: unknown, record: IOpportunity) => {
        const insight = insightByOpportunityId.get(record.id);

        return insight ? <Tag color="#1f365c">{insight.priorityBand}</Tag> : <Tag>Unranked</Tag>;
      },
      title: "Priority",
    },
    {
      dataIndex: "stage",
      key: "stage",
      render: (stage: string) => <Tag color={OPPORTUNITY_STAGE_COLORS[stage] ?? "#94a3b8"}>{stage}</Tag>,
      title: "Stage",
    },
    {
      key: "value",
      render: (_: unknown, record: IOpportunity) =>
        formatCurrency(record.value ?? record.estimatedValue),
      title: "Value",
    },
    {
      dataIndex: "expectedCloseDate",
      key: "expectedCloseDate",
      title: "Target close",
    },
    {
      key: "owner",
      render: (_: unknown, record: IOpportunity) =>
        teamMembers.find((member) => member.id === record.ownerId)?.name ?? "Unassigned",
      title: "Owner",
    },
  ];

  const proposalColumns = [
    {
      dataIndex: "title",
      key: "title",
      title: "Proposal",
    },
    {
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={PROPOSAL_STATUS_COLORS[status] ?? "#94a3b8"}>{status}</Tag>
      ),
      title: "Status",
    },
    {
      key: "value",
      render: (_: unknown, record: IProposal) => formatCurrency(record.value ?? 0),
      title: "Value",
    },
    {
      dataIndex: "validUntil",
      key: "validUntil",
      title: "Valid until",
    },
  ];

  return (
    <div className="space-y-6">
      <Space orientation="vertical" size={8}>
        <Link
          className="inline-flex items-center gap-2 font-medium text-[#355c7d] transition-colors hover:text-[#f28c28]"
          href="/dashboard/clients"
        >
          <ArrowLeftOutlined />
          Back to clients
        </Link>
        <div className="space-y-2">
          <Typography.Title className="!mb-0 !text-slate-900" level={2}>
            {client.name}
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 max-w-3xl !text-slate-500">
            {client.industry} account in the {client.segment ?? "Unassigned"} segment with{" "}
            {client.isActive ? "active" : "inactive"} commercial tracking.
          </Typography.Paragraph>
        </div>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card className="h-full border-slate-200 shadow-sm">
            <Typography.Text className="!text-slate-500">Open pipeline</Typography.Text>
            <Typography.Title className="!mb-1 !mt-2" level={3}>
              {formatCurrency(openPipelineValue)}
            </Typography.Title>
            <Typography.Text className="!text-slate-500">
              {clientOpportunities.length} opportunity{clientOpportunities.length === 1 ? "" : "ies"} linked to this client.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="h-full border-slate-200 shadow-sm">
            <Typography.Text className="!text-slate-500">Highest priority</Typography.Text>
            <Typography.Title className="!mb-1 !mt-2" level={3}>
              {topPriority?.priorityBand ?? "None"}
            </Typography.Title>
            <Typography.Text className="!text-slate-500">
              {topPriority
                ? `${Math.max(getDaysUntil(topPriority.opportunity.expectedCloseDate), 0)} day${Math.abs(getDaysUntil(topPriority.opportunity.expectedCloseDate)) === 1 ? "" : "s"} to close ${topPriority.opportunity.title}.`
                : "No active opportunities to rank yet."}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="h-full border-slate-200 shadow-sm">
            <Typography.Text className="!text-slate-500">Proposals</Typography.Text>
            <Typography.Title className="!mb-1 !mt-2" level={3}>
              {clientProposals.length}
            </Typography.Title>
            <Typography.Text className="!text-slate-500">
              {clientProposals.filter((proposal) => proposal.status === "Submitted").length} awaiting client or internal decision.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="h-full border-slate-200 shadow-sm">
            <Typography.Text className="!text-slate-500">Contracts</Typography.Text>
            <Typography.Title className="!mb-1 !mt-2" level={3}>
              {clientContracts.length}
            </Typography.Title>
            <Typography.Text className="!text-slate-500">
              {clientContracts.filter((contract) => contract.status === "Active").length} active contract{clientContracts.filter((contract) => contract.status === "Active").length === 1 ? "" : "s"} on record.
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card className="h-full border-slate-200 shadow-sm" title="Client details">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Industry">{client.industry}</Descriptions.Item>
              <Descriptions.Item label="Segment">{client.segment ?? "Not set"}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={client.isActive ? "green" : "red"}>
                  {client.isActive ? "Active" : "Inactive"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Website">{client.website ?? "Not set"}</Descriptions.Item>
              <Descriptions.Item label="Company size">
                {client.companySize ?? "Not set"}
              </Descriptions.Item>
              <Descriptions.Item label="Tax number">{client.taxNumber ?? "Not set"}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card
        className="border-slate-200 shadow-sm"
        title={`Priority pipeline (${clientOpportunities.length})`}
      >
        <AnimatedDashboardTable
          columns={opportunityColumns}
          dataSource={clientOpportunities}
          emptyDescription="No opportunities linked to this client yet"
          rowKey="id"
        />
      </Card>

      <Card
        className="border-slate-200 shadow-sm"
        title={`Proposals (${clientProposals.length})`}
      >
        <AnimatedDashboardTable
          columns={proposalColumns}
          dataSource={clientProposals}
          emptyDescription="No proposals linked to this client yet"
          rowKey="id"
        />
      </Card>
    </div>
  );
}
