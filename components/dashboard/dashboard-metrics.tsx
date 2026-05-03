"use client";

import { Card, Col, Row, Statistic, Tag, Typography } from "antd";

import { getOpenPipelineValue, getOpportunityInsights } from "@/providers/salesSelectors";
import { useDashboardState } from "@/providers/dashboardProvider";
import { OpportunityPriorityQueue } from "./opportunity-priority-queue";
import { PriorityAdvisor } from "./priority-advisor";
import { ReassignmentSimulator } from "./reassignment-simulator";
import { TeamCapacityPanel } from "./team-capacity-panel";
import { useStyles } from "./dashboard-metrics.styles";

export const DashboardMetrics = () => {
  const { styles } = useStyles();
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
    <div className={styles.container}>
      <Row gutter={[16, 16]}>
        <Col className={styles.rowColumn} xs={24} sm={12} xl={6}>
          <Card className={styles.metricCard}>
            <Statistic
              prefix="R "
              precision={0}
              title="Pipeline value"
              value={pipelineValue}
            />
            <Typography.Text className={styles.infoText}>
              All live opportunities in one total.
            </Typography.Text>
          </Card>
        </Col>
        <Col className={styles.rowColumn} xs={24} sm={12} xl={6}>
          <Card className={styles.metricCard}>
            <Statistic title="Open opportunities" value={insights.length} />
            <Typography.Text className={styles.infoText}>
              Plain-language pipeline from New to Won.
            </Typography.Text>
          </Card>
        </Col>
        <Col className={styles.rowColumn} xs={24} sm={12} xl={6}>
          <Card className={styles.metricCard}>
            <Statistic title="Proposal workload" value={submittedProposals} />
            <div className={styles.metricTagRow}>
              <Tag color="gold">{draftProposals} draft</Tag>
              <Tag color="blue">{submittedProposals} submitted</Tag>
            </div>
          </Card>
        </Col>
        <Col className={styles.rowColumn} xs={24} sm={12} xl={6}>
          <Card className={styles.metricCard}>
            <Statistic title="Follow-ups due" value={activeFollowUps} />
            <Typography.Text className={styles.infoText}>
              Generated and tracked against each deal.
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      {topDeal ? (
        <Card className={styles.priorityCard}>
          <div className={styles.priorityDetails}>
            <div className={styles.rowColumn}>
              <div className={styles.titleBlock}>
              <Tag color="blue">Top priority</Tag>
              <Typography.Title className={styles.titleReset} level={3}>
                {topDeal.opportunity.title}
              </Typography.Title>
              <Typography.Paragraph className={styles.subduedText}>
                {topDeal.summary} Owner: {topDeal.owner?.name ?? "Auto-pick pending"}.
              </Typography.Paragraph>
              </div>
            </div>
            <div className={styles.priorityGrid}>
              <div className={styles.priorityItem}>
                <Typography.Text className={styles.infoText}>Money weight</Typography.Text>
                <Typography.Title className={styles.titleReset} level={4}>
                  {topDeal.moneyWeight}
                </Typography.Title>
              </div>
              <div className={styles.priorityItem}>
                <Typography.Text className={styles.infoText}>Deadline weight</Typography.Text>
                <Typography.Title className={styles.titleReset} level={4}>
                  {topDeal.deadlineWeight}
                </Typography.Title>
              </div>
              <div className={styles.priorityItem}>
                <Typography.Text className={styles.infoText}>Priority score</Typography.Text>
                <Typography.Title className={styles.titleReset} level={4}>
                  {topDeal.score}
                </Typography.Title>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <Row gutter={[16, 16]}>
        <Col className={styles.rowColumn} xs={24} xxl={14}>
          <OpportunityPriorityQueue />
        </Col>
        <Col className={styles.rowColumn} xs={24} xxl={10}>
          <PriorityAdvisor />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col className={styles.rowColumn} xs={24} xxl={14}>
          <TeamCapacityPanel />
        </Col>
        <Col className={styles.rowColumn} xs={24} xxl={10}>
          <ReassignmentSimulator />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col className={styles.rowColumn} xs={24}>
          <Card className={styles.automationCard} title="Automation feed">
            <div className={styles.automationFeed}>
              {automationFeed.map((event) => (
                <div
                  className={styles.automationItem}
                  key={event.id}
                >
                  <Typography.Text className={styles.breakText} strong>
                    {event.title}
                  </Typography.Text>
                  <Typography.Paragraph className={styles.subduedText}>
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
