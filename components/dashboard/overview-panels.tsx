"use client";
import { Card, Tabs, Tag, Typography } from "antd";
import { DashboardMetrics } from "./dashboard-metrics";
import { OpportunitiesPanel } from "./opportunities-panel";
import { ProposalsPanel } from "./proposals-panel";
import { RenewalsPanel } from "./renewals-panel";
import { ActivitiesPanel } from "./activities-panel";
import { useStyles } from "./overview-panels.styles";
export const OverviewPanels = () => {
    const { styles } = useStyles();
    const tabs = [
        {
            key: "overview",
            label: "Overview",
            children: <DashboardMetrics />,
        },
        {
            key: "opportunities",
            label: "Opportunities",
            children: <OpportunitiesPanel />,
        },
        {
            key: "proposals",
            label: "Proposals",
            children: <ProposalsPanel />,
        },
        {
            key: "renewals",
            label: "Renewals",
            children: <RenewalsPanel />,
        },
        {
            key: "activities",
            label: "Activities",
            children: <ActivitiesPanel />,
        },
    ];
    return (<div className={styles.container}>
      <div className={styles.header}>
        <Tag color="geekblue">Dashboard</Tag>
        <Typography.Title className={styles.title} level={2}>
          Sales automation overview
        </Typography.Title>
        <Typography.Paragraph className={styles.description}>
          Track pipeline movement, proposal throughput, renewals, and activities from one operational view.
        </Typography.Paragraph>
      </div>

      <Card>
        <Tabs defaultActiveKey="overview" items={tabs}/>
      </Card>
    </div>);
};
