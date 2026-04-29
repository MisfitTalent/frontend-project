"use client";

import { Card, Col, Progress, Row, Statistic, Tag, Typography } from "antd";
import { useMemo } from "react";

import { AnimatedDashboardTable } from "@/components/dashboard/animated-dashboard-table";
import { useDashboardState } from "@/providers/dashboardProvider";
import { type ITeamMember } from "@/providers/salesTypes";

type TeamMemberRow = ITeamMember & {
  assignedOpportunities: number;
  openActivities: number;
  totalLoad: number;
};

export function TeamMembersPanel() {
  const { salesData, teamMembers } = useDashboardState();

  const rows = useMemo<TeamMemberRow[]>(
    () =>
      teamMembers
        .map((member) => {
          const assignedOpportunities = salesData.opportunities.filter(
            (opportunity) =>
              opportunity.ownerId === member.id &&
              !["Won", "Lost"].includes(String(opportunity.stage)),
          ).length;
          const openActivities = salesData.activities.filter(
            (activity) =>
              activity.assignedToId === member.id &&
              activity.status !== "Completed" &&
              !activity.completed,
          ).length;

          return {
            ...member,
            assignedOpportunities,
            openActivities,
            totalLoad: assignedOpportunities + openActivities,
          };
        })
        .sort((left, right) => {
          if (right.totalLoad !== left.totalLoad) {
            return right.totalLoad - left.totalLoad;
          }

          if (left.availabilityPercent !== right.availabilityPercent) {
            return left.availabilityPercent - right.availabilityPercent;
          }

          return left.name.localeCompare(right.name);
        }),
    [salesData.activities, salesData.opportunities, teamMembers],
  );

  const averageAvailability = useMemo(() => {
    if (rows.length === 0) {
      return 0;
    }

    return Math.round(
      rows.reduce((sum, member) => sum + member.availabilityPercent, 0) / rows.length,
    );
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
          <Typography.Text strong>{record.name}</Typography.Text>
          <div className="text-sm text-slate-500">{record.role}</div>
        </div>
      ),
      title: "Team member",
    },
    {
      dataIndex: "region",
      key: "region",
      title: "Region",
    },
    {
      key: "availability",
      render: (_: unknown, record: TeamMemberRow) => (
        <div className="min-w-[140px]">
          <Progress percent={record.availabilityPercent} size="small" showInfo={false} />
          <Typography.Text className="!text-slate-500">
            {record.availabilityPercent}% available
          </Typography.Text>
        </div>
      ),
      title: "Availability",
    },
    {
      dataIndex: "assignedOpportunities",
      key: "assignedOpportunities",
      title: "Live opportunities",
    },
    {
      dataIndex: "openActivities",
      key: "openActivities",
      title: "Open follow-ups",
    },
    {
      key: "skills",
      render: (_: unknown, record: TeamMemberRow) => (
        <div className="flex flex-wrap gap-2">
          {record.skills.slice(0, 3).map((skill) => (
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
            <Statistic title="Average availability" value={averageAvailability} suffix="%" />
            <Typography.Text className="!text-slate-500">
              Useful for balancing owner assignments and follow-up load.
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

      <Card
        className="border-slate-200"
        title="Team workload"
      >
        <AnimatedDashboardTable
          columns={columns}
          dataSource={rows}
          emptyDescription="No team members available"
          rowKey="id"
          scroll={{ x: 960 }}
        />
      </Card>
    </div>
  );
}
