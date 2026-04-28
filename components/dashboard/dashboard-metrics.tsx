"use client";

import { Card, Col, Row, Statistic, Tag, Typography } from "antd";

import { getOpenPipelineValue, getOpportunityInsights } from "@/providers/salesSelectors";
import { useDashboardState } from "@/providers/dashboardProvider";
import { OpportunityPriorityQueue } from "./opportunity-priority-queue";
import { PriorityAdvisor } from "./priority-advisor";
import { ReassignmentSimulator } from "./reassignment-simulator";
import { TeamCapacityPanel } from "./team-capacity-panel";

export const DashboardMetrics = () => {
  const { salesData, automationFeed } = useDashboardState();
  const insights = getOpportunityInsights(salesData);
  const topDeal = insights[0];
  const submittedProposals = salesData.proposals.filter(
    (proposal) => String(proposal.status) === "Submitted",
  ).length;
  const draftProposals = salesData.proposals.filter(
    (proposal) => String(proposal.status) === "Draft",
  ).length;
  const activeFollowUps = salesData.activities.filter(
    (activity) => !activity.completed && String(activity.status) !== "Completed",
  ).length;
  const pipelineValue = getOpenPipelineValue(salesData);

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card className="h-full border-slate-200">
            <Statistic
              prefix="R "
              precision={0}
              title="Pipeline value"
              value={pipelineValue}
            />
            <Typography.Text className="!text-slate-500">
              All live opportunities in one total.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="h-full border-slate-200">
            <Statistic title="Open opportunities" value={insights.length} />
            <Typography.Text className="!text-slate-500">
              Plain-language pipeline from New to Won.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="h-full border-slate-200">
            <Statistic title="Proposal workload" value={submittedProposals} />
            <div className="mt-2 flex flex-wrap gap-2">
              <Tag color="#eab308">{draftProposals} draft</Tag>
              <Tag color="#2563eb">{submittedProposals} submitted</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="h-full border-slate-200">
            <Statistic title="Follow-ups due" value={activeFollowUps} />
            <Typography.Text className="!text-slate-500">
              Generated and tracked against each deal.
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      {topDeal ? (
        <Card className="border-slate-200 bg-[linear-gradient(135deg,_#eef3f8,_#fff7ed)]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 space-y-2">
              <Tag color="#f97316">Top priority</Tag>
              <Typography.Title className="!mb-0" level={3}>
                {topDeal.opportunity.title}
              </Typography.Title>
              <Typography.Paragraph className="!mb-0 !text-slate-600">
                {topDeal.summary} Owner: {topDeal.owner?.name ?? "Auto-pick pending"}.
              </Typography.Paragraph>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 2xl:grid-cols-3 xl:max-w-2xl">
              <div className="rounded-2xl bg-white px-4 py-3">
                <Typography.Text className="!text-slate-500">Money weight</Typography.Text>
                <Typography.Title className="!mb-0" level={4}>
                  {topDeal.moneyWeight}
                </Typography.Title>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <Typography.Text className="!text-slate-500">Deadline weight</Typography.Text>
                <Typography.Title className="!mb-0" level={4}>
                  {topDeal.deadlineWeight}
                </Typography.Title>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <Typography.Text className="!text-slate-500">Priority score</Typography.Text>
                <Typography.Title className="!mb-0" level={4}>
                  {topDeal.score}
                </Typography.Title>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <Row gutter={[16, 16]}>
        <Col className="min-w-0" xs={24} xxl={14}>
          <OpportunityPriorityQueue />
        </Col>
        <Col className="min-w-0" xs={24} xxl={10}>
          <PriorityAdvisor />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col className="min-w-0" xs={24} xxl={14}>
          <TeamCapacityPanel />
        </Col>
        <Col className="min-w-0" xs={24} xxl={10}>
          <ReassignmentSimulator />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col className="min-w-0" xs={24}>
          <Card className="h-full" title="Automation feed">
            <div className="space-y-4">
              {automationFeed.map((event) => (
                <div
                  className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  key={event.id}
                >
                  <Typography.Text className="break-words" strong>
                    {event.title}
                  </Typography.Text>
                  <Typography.Paragraph className="!mb-0 !mt-1 !text-slate-500">
                    {event.description}
                  </Typography.Paragraph>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
