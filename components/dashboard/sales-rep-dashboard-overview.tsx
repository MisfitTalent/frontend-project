"use client";

import { Card, Col, Empty, Row, Tag, Typography } from "antd";
import Link from "next/link";
import { useMemo } from "react";

import { PriorityAdvisor } from "@/components/dashboard/priority-advisor";
import { useActivityState } from "@/providers/activityProvider";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import type { INoteItem } from "@/providers/domainSeeds";
import { useNoteState } from "@/providers/noteProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { useProposalState } from "@/providers/proposalProvider";
import { formatCurrency, getOpportunityInsights } from "@/providers/salesSelectors";

const CLIENT_MESSAGE_CATEGORY = "Client Message";
const LEGACY_CLIENT_MESSAGE_PREFIX = `${CLIENT_MESSAGE_CATEGORY} `;

const isClientMessage = (note: INoteItem) =>
  note.kind === "client_message" ||
  note.category === CLIENT_MESSAGE_CATEGORY ||
  note.category?.startsWith(LEGACY_CLIENT_MESSAGE_PREFIX);

export function SalesRepDashboardOverview() {
  const { user } = useAuthState();
  const { activities } = useActivityState();
  const { clients } = useClientState();
  const { notes } = useNoteState();
  const { opportunities } = useOpportunityState();
  const { proposals } = useProposalState();

  const ownedOpportunities = useMemo(
    () => opportunities.filter((item) => item.ownerId === user?.userId),
    [opportunities, user?.userId],
  );
  const openOwnedOpportunities = ownedOpportunities.filter(
    (item) => !["Won", "Lost"].includes(String(item.stage)),
  );
  const ownedOpportunityIds = new Set(ownedOpportunities.map((item) => item.id));
  const ownedClientIds = [...new Set(ownedOpportunities.map((item) => item.clientId))];
  const ownedClients = clients.filter((item) => ownedClientIds.includes(item.id));
  const ownedActivities = activities.filter(
    (item) =>
      item.assignedToId === user?.userId &&
      String(item.status) !== "Completed" &&
      !item.completed,
  );
  const ownedProposals = proposals.filter((item) => ownedOpportunityIds.has(item.opportunityId));
  const clientMessages = notes
    .filter(
      (item) =>
        isClientMessage(item) &&
        (item.representativeId === user?.userId ||
          (item.clientId ? ownedClientIds.includes(item.clientId) : false)),
    )
    .sort((left, right) => right.createdDate.localeCompare(left.createdDate));

  const pipelineValue = openOwnedOpportunities.reduce(
    (sum, item) => sum + (item.value ?? item.estimatedValue),
    0,
  );
  const topInsight = getOpportunityInsights({
    activities,
    automationFeed: [],
    clients,
    contacts: [],
    contracts: [],
    opportunities,
    proposals,
    renewals: [],
    teamMembers: [],
  }).find((item) => item.opportunity.ownerId === user?.userId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Tag color="#4f7cac">Sales rep workspace</Tag>
        <Typography.Title className="!mb-0 !text-slate-900" level={2}>
          My portfolio
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 max-w-3xl !text-slate-500">
          Track your live accounts, follow-ups, message load, and the next best action from one workspace.
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Link href="/dashboard/opportunities">
            <Card className="h-full border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5">
              <Typography.Text className="!text-slate-500">Pipeline value</Typography.Text>
              <Typography.Title className="!mb-1 !mt-2" level={3}>
                {formatCurrency(pipelineValue)}
              </Typography.Title>
              <Typography.Text className="!text-slate-500">
                {openOwnedOpportunities.length} live deal{openOwnedOpportunities.length === 1 ? "" : "s"} in your portfolio.
              </Typography.Text>
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Link href="/dashboard/clients">
            <Card className="h-full border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5">
              <Typography.Text className="!text-slate-500">Active clients</Typography.Text>
              <Typography.Title className="!mb-1 !mt-2" level={3}>
                {ownedClients.length}
              </Typography.Title>
              <Typography.Text className="!text-slate-500">
                Accounts currently linked to your owned opportunities.
              </Typography.Text>
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Link href="/dashboard/proposals">
            <Card className="h-full border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5">
              <Typography.Text className="!text-slate-500">Proposal workload</Typography.Text>
              <Typography.Title className="!mb-1 !mt-2" level={3}>
                {ownedProposals.length}
              </Typography.Title>
              <Typography.Text className="!text-slate-500">
                {ownedProposals.filter((item) => String(item.status) === "Submitted").length} submitted and waiting.
              </Typography.Text>
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Link href="/dashboard/activities">
            <Card className="h-full border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5">
              <Typography.Text className="!text-slate-500">Follow-ups due</Typography.Text>
              <Typography.Title className="!mb-1 !mt-2" level={3}>
                {ownedActivities.length}
              </Typography.Title>
              <Typography.Text className="!text-slate-500">
                {ownedActivities.filter((item) => item.priority === 1).length} marked as priority 1.
              </Typography.Text>
            </Card>
          </Link>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card className="h-full border-slate-200 shadow-sm" title="Top account priority">
            {topInsight ? (
              <div className="space-y-4">
                <div>
                  <Tag color="#f97316">{topInsight.priorityBand}</Tag>
                  <Typography.Title className="!mb-1 !mt-2" level={4}>
                    {topInsight.opportunity.title}
                  </Typography.Title>
                  <Typography.Paragraph className="!mb-0 !text-slate-600">
                    {topInsight.client?.name ?? "Unassigned client"} · {formatCurrency(topInsight.opportunity.value ?? topInsight.opportunity.estimatedValue)} ·{" "}
                    {topInsight.daysToClose <= 0 ? "Past due" : `${topInsight.daysToClose} day${topInsight.daysToClose === 1 ? "" : "s"} to close`}
                  </Typography.Paragraph>
                </div>
                <Typography.Paragraph className="!mb-0 !text-slate-500">
                  {topInsight.summary}
                </Typography.Paragraph>
              </div>
            ) : (
              <Empty
                description="No live opportunities are assigned to you yet."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card className="h-full border-slate-200 shadow-sm" title="Client messages">
            {clientMessages.length > 0 ? (
              <div className="space-y-4">
                {clientMessages.slice(0, 4).map((note) => (
                  <div
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    key={note.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Typography.Text strong>{note.title}</Typography.Text>
                      <Tag color={note.source === "workspace" ? "gold" : "blue"}>
                        {note.source === "workspace" ? "Sent" : "Incoming"}
                      </Tag>
                    </div>
                    <Typography.Paragraph className="!mb-1 !mt-2 !text-slate-600">
                      {note.content}
                    </Typography.Paragraph>
                    <Typography.Text className="!text-slate-500">
                      {note.createdDate}
                    </Typography.Text>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                description="No client message threads are assigned to you yet."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>

      <PriorityAdvisor />
    </div>
  );
}
