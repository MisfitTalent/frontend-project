"use client";

import { Button, Card, Col, Row, Statistic, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";

import { formatCurrency, getOpenPipelineValue, getOpportunityInsights } from "@/providers/salesSelectors";
import { OPPORTUNITY_STAGE_COLORS, OPPORTUNITY_STAGE_ORDER, type IOpportunity } from "@/providers/salesTypes";
import { useClientState } from "@/providers/clientProvider";
import { useDashboardState } from "@/providers/dashboardProvider";
import { useOpportunityActions, useOpportunityState } from "@/providers/opportunityProvider";
import { AnimatedDashboardTable } from "./animated-dashboard-table";
import { KanbanBoard } from "./kanban-board";
import { OpportunityForm } from "./opportunity-form";
import { OpportunityPriorityQueue } from "./opportunity-priority-queue";

export function OpportunitiesPanel() {
  const { opportunities } = useOpportunityState();
  const { deleteOpportunity, updateOpportunity } = useOpportunityActions();
  const { clients } = useClientState();
  const { salesData, teamMembers } = useDashboardState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insights = getOpportunityInsights(salesData);
  const pipelineValue = getOpenPipelineValue(salesData);

  const columns = [
    {
      dataIndex: "name",
      key: "name",
      title: "Opportunity",
    },
    {
      key: "client",
      render: (_: unknown, record: IOpportunity) =>
        clients.find((client) => client.id === record.clientId)?.name ?? "Client pending",
      title: "Client",
    },
    {
      dataIndex: "value",
      key: "value",
      render: (value: number, record: IOpportunity) =>
        formatCurrency(value ?? record.estimatedValue),
      title: "Value",
    },
    {
      dataIndex: "stage",
      key: "stage",
      render: (stage: string) => <Tag color={OPPORTUNITY_STAGE_COLORS[stage]}>{stage}</Tag>,
      title: "Pipeline stage",
    },
    {
      dataIndex: "probability",
      key: "probability",
      render: (probability: number) => `${probability}%`,
      title: "Confidence",
    },
    {
      dataIndex: "expectedCloseDate",
      key: "expectedCloseDate",
      title: "Target close",
    },
    {
      key: "owner",
      render: (_: unknown, record: IOpportunity) =>
        teamMembers.find((member) => member.id === record.ownerId)?.name ??
        "Auto-pick pending",
      title: "Owner",
    },
    {
      key: "actions",
      render: (_: unknown, record: IOpportunity) => (
        <div className="space-x-2">
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditingId(record.id)}
            size="small"
            type="text"
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteOpportunity(record.id)}
            size="small"
            type="text"
          />
        </div>
      ),
      title: "Actions",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Typography.Title className="!m-0" level={4}>
            Opportunities ({opportunities.length})
          </Typography.Title>
          <Typography.Text className="!text-slate-500">
            New, Qualified, Proposal Sent, Negotiating, Won, and Lost are written for non-technical users.
          </Typography.Text>
        </div>
        <Button icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} type="primary">
          Add opportunity
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xxl={6}>
          <Card className="h-full border-slate-200">
            <Statistic title="Live pipeline value" value={pipelineValue} prefix="R " precision={0} />
            <Typography.Text className="!text-slate-500">
              Updates as soon as a live opportunity is added or edited.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xxl={6}>
          <Card className="h-full border-slate-200">
            <Statistic title="Live opportunities" value={insights.length} />
            <Typography.Text className="!text-slate-500">
              Won and lost deals are excluded from the active pipeline.
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col className="min-w-0" xs={24} xxl={10}>
          <OpportunityPriorityQueue limit={6} />
        </Col>
        <Col className="min-w-0" xs={24} xxl={14}>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {insights.slice(0, 3).map((insight) => (
              <div
                className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                key={insight.opportunity.id}
              >
                <Tag color={OPPORTUNITY_STAGE_COLORS[String(insight.opportunity.stage)]}>
                  {insight.priorityBand}
                </Tag>
                <Typography.Title className="!mb-1 !mt-3 break-words" level={5}>
                  {insight.opportunity.title}
                </Typography.Title>
                <Typography.Paragraph className="!mb-3 !text-slate-500">
                  {insight.summary}
                </Typography.Paragraph>
                <Typography.Text className="break-words !text-slate-600">
                  Owner: {insight.owner?.name ?? "Auto-pick pending"}
                </Typography.Text>
              </div>
            ))}
          </div>
        </Col>
      </Row>

      <KanbanBoard
        items={opportunities.map((opportunity) => ({
          id: opportunity.id,
          metadata: {
            client: clients.find((client) => client.id === opportunity.clientId)?.name ?? "Client pending",
            owner:
              teamMembers.find((member) => member.id === opportunity.ownerId)?.name ??
              "Unassigned",
          },
          stage: String(opportunity.stage),
          title: opportunity.name || opportunity.title,
          value: opportunity.value || opportunity.estimatedValue,
        }))}
        onDelete={deleteOpportunity}
        onEdit={(id) => setEditingId(id)}
        onStageChange={(id, newStage) => updateOpportunity(id, { stage: newStage })}
        stageColors={OPPORTUNITY_STAGE_COLORS}
        stages={OPPORTUNITY_STAGE_ORDER}
        title="Automated pipeline"
      />

      <AnimatedDashboardTable
        columns={columns}
        dataSource={opportunities}
        emptyDescription="No opportunities yet"
        isBusy={isSubmitting}
        rowKey="id"
      />

      <OpportunityForm
        editingId={editingId}
        isOpen={isModalOpen || editingId !== null}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        onSubmitEnd={() => setIsSubmitting(false)}
        onSubmitStart={() => setIsSubmitting(true)}
      />
    </div>
  );
}
