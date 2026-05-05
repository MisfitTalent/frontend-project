"use client";

import { Card, Col, Progress, Row, Statistic, Tag, Typography } from "antd";
import Link from "next/link";
import { useMemo } from "react";

import { AnimatedDashboardTable } from "@/components/dashboard/animated-dashboard-table";
import { useDashboardState } from "@/providers/dashboardProvider";
import { usePricingRequestState } from "@/providers/pricingRequestProvider";
import { getTeamCapacity, type TeamWorkloadProfile } from "@/providers/salesSelectors";

type TeamMemberRow = TeamWorkloadProfile;

export function TeamMembersPanel() {
  const { salesData } = useDashboardState();
  const { pricingRequests } = usePricingRequestState();

  const rows = useMemo<TeamMemberRow[]>(
    () => getTeamCapacity(salesData, { pricingRequests }),
    [pricingRequests, salesData],
  );

  const averageAvailability = useMemo(() => {
    if (rows.length === 0) {
      return 0;
    }

    return Math.round(rows.reduce((sum, row) => sum + row.availableCapacity, 0) / rows.length);
  }, [rows]);

  const totalOpenOpportunities = useMemo(
    () =>
      salesData.opportunities.filter(
        (opportunity) => !["Won", "Lost"].includes(String(opportunity.stage)),
      ).length,
    [salesData.opportunities],
  );

  const totalOpenActivities = useMemo(
    () =>
      salesData.activities.filter(
        (activity) => activity.status !== "Completed" && !activity.completed,
      ).length,
    [salesData.activities],
  );

  const columns = [
    {
      key: "member",
      render: (_: unknown, record: TeamMemberRow) => (
        <div className="space-y-1">
          <Typography.Text strong>
            <Link
              className="text-inherit transition-colors hover:text-[#f28c28]"
              href={`/dashboard/team-members/${record.member.id}`}
            >
              {record.member.name}
            </Link>
          </Typography.Text>
          <div className="text-sm text-slate-500">{record.member.role}</div>
        </div>
      ),
      title: "Team member",
    },
    {
      dataIndex: ["member", "region"],
      key: "region",
      title: "Region",
    },
    {
      key: "availability",
      render: (_: unknown, record: TeamMemberRow) => (
        <div className="min-w-[140px]">
          <Progress percent={record.availableCapacity} size="small" showInfo={false} />
          <Typography.Text className="!text-slate-500">
            {record.availableCapacity}% capacity from tracked workload
          </Typography.Text>
        </div>
      ),
      title: "Adjusted capacity",
    },
    {
      dataIndex: "assignedOpportunities",
      key: "assignedOpportunities",
      render: (_: unknown, record: TeamMemberRow) => record.assignments,
      title: "Live opportunities",
    },
    {
      dataIndex: "openFollowUps",
      key: "openActivities",
      title: "Open follow-ups",
    },
    {
      dataIndex: "overdueFollowUps",
      key: "overdueFollowUps",
      title: "Overdue",
    },
    {
      key: "skills",
      render: (_: unknown, record: TeamMemberRow) => (
        <div className="flex flex-wrap gap-2">
          {record.member.skills.slice(0, 3).map((skill) => (
            <Tag color="#4f7cac" key={skill}>
              {skill}
            </Tag>
          ))}
        </div>
      ),
      title: "Skills",
    },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xxl={6}>
          <Card className="h-full border-slate-200">
            <Statistic title="Team members" value={rows.length} />
            <Typography.Text className="!text-slate-500">
              Visible roster for the current sales workspace.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xxl={6}>
          <Card className="h-full border-slate-200">
            <Statistic title="Average capacity" value={averageAvailability} suffix="%" />
            <Typography.Text className="!text-slate-500">
              Computed only from tracked workload across active commercial work.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xxl={6}>
          <Card className="h-full border-slate-200">
            <Statistic title="Live opportunities" value={totalOpenOpportunities} />
            <Typography.Text className="!text-slate-500">
              Open opportunities currently assigned across the team.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xxl={6}>
          <Card className="h-full border-slate-200">
            <Statistic title="Open follow-ups" value={totalOpenActivities} />
            <Typography.Text className="!text-slate-500">
              Scheduled work still in progress or awaiting completion.
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Card className="border-slate-200" title="Team workload">
        <AnimatedDashboardTable
          columns={columns}
          dataSource={rows}
          emptyDescription="No team members available"
          rowKey={(record) => record.member.id}
          scroll={{ x: 960 }}
        />
      </Card>
    </div>
  );
}
