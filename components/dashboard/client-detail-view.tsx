"use client";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Card, Col, Descriptions, Empty, Row, Skeleton, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import { useContactState } from "@/providers/contactProvider";
import { useContractState } from "@/providers/contractProvider";
import { useDashboardState } from "@/providers/dashboardProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { useProposalState } from "@/providers/proposalProvider";
import { formatCurrency, getDaysUntil, getOpportunityInsights } from "@/providers/salesSelectors";
import { OPPORTUNITY_STAGE_COLORS, PROPOSAL_STATUS_COLORS, type IOpportunity, type IProposal, } from "@/providers/salesTypes";
import { AnimatedDashboardTable } from "./animated-dashboard-table";
import { ClientMessageCenter } from "./client-message-center";
import { useStyles } from "./client-detail-view.styles";
type ClientDetailViewProps = Readonly<{
    clientId: string;
}>;
export const ClientDetailView = ({ clientId }: ClientDetailViewProps) => {
    const { user } = useAuthState();
    const { clients } = useClientState();
    const { contacts } = useContactState();
    const { proposals } = useProposalState();
    const { opportunities } = useOpportunityState();
    const { contracts } = useContractState();
    const { salesData, teamMembers } = useDashboardState();
    const { styles } = useStyles();
    const isClientScoped = isClientScopedUser(user?.clientIds);
    const client = clients.find((item) => item.id === clientId);
    const clientContacts = contacts.filter((contact) => contact.clientId === clientId);
    const primaryContact = clientContacts.find((contact) => contact.isPrimaryContact) ?? clientContacts[0];
    const clientOpportunities = opportunities.filter((opportunity) => opportunity.clientId === clientId);
    const clientProposals = proposals.filter((proposal) => proposal.clientId === clientId);
    const clientContracts = contracts.filter((contract) => contract.clientId === clientId);
    const activeClientOpportunities = clientOpportunities.filter((opportunity) => !["Won", "Lost"].includes(String(opportunity.stage)));
    const opportunityInsights = getOpportunityInsights(salesData).filter((insight) => insight.opportunity.clientId === clientId);
    const insightByOpportunityId = new Map(opportunityInsights.map((insight) => [insight.opportunity.id, insight]));
    const topPriority = opportunityInsights[0];
    const nextCommercialOpportunity = [...activeClientOpportunities].sort((left, right) => left.expectedCloseDate.localeCompare(right.expectedCloseDate))[0];
    const accountLeadName = teamMembers.find((member) => member.id === nextCommercialOpportunity?.ownerId)?.name ??
        teamMembers.find((member) => member.id === clientOpportunities[0]?.ownerId)?.name ??
        "Unassigned";
    const openPipelineValue = clientOpportunities
        .filter((opportunity) => !["Won", "Lost"].includes(String(opportunity.stage)))
        .reduce((sum, opportunity) => sum + (opportunity.value ?? opportunity.estimatedValue), 0);
    const activeCommercialValue = activeClientOpportunities.reduce((sum, opportunity) => sum + (opportunity.value ?? opportunity.estimatedValue), 0);
    if (!client && clients.length === 0) {
        return (<div className={styles.container}>
        <div className={styles.header}>
          <Skeleton.Button active block className={styles.skeletonButton}/>
          <Skeleton active paragraph={{ rows: 1 }} title={{ width: "40%" }}/>
        </div>
        <Card className={styles.card}>
          <Skeleton active paragraph={{ rows: 10 }}/>
        </Card>
      </div>);
    }
    if (!client) {
        return (<div className={styles.container}>
        <Link className={styles.backLink} href="/dashboard/clients">
          <ArrowLeftOutlined />
          Back to clients
        </Link>
        <Card className={styles.card}>
          <Empty description="This client record could not be found." image={Empty.PRESENTED_IMAGE_SIMPLE}/>
        </Card>
      </div>);
    }
    const opportunityColumns = [
        {
            dataIndex: "title",
            key: "title",
            title: isClientScoped ? "Commercial item" : "Opportunity",
        },
        ...(!isClientScoped
            ? [
                {
                    key: "priority",
                    render: (_: unknown, record: IOpportunity) => {
                        const insight = insightByOpportunityId.get(record.id);
                        return insight ? <Tag color="geekblue">{insight.priorityBand}</Tag> : <Tag>Unranked</Tag>;
                    },
                    title: "Priority",
                },
            ]
            : []),
        {
            dataIndex: "stage",
            key: "stage",
            render: (stage: string) => <Tag color={OPPORTUNITY_STAGE_COLORS[stage] ?? "default"}>{stage}</Tag>,
            title: isClientScoped ? "Current status" : "Stage",
        },
        {
            key: "value",
            render: (_: unknown, record: IOpportunity) => formatCurrency(record.value ?? record.estimatedValue),
            title: "Value",
        },
        {
            dataIndex: "expectedCloseDate",
            key: "expectedCloseDate",
            title: isClientScoped ? "Target date" : "Target close",
        },
        {
            key: "owner",
            render: (_: unknown, record: IOpportunity) => teamMembers.find((member) => member.id === record.ownerId)?.name ?? "Unassigned",
            title: isClientScoped ? "Account lead" : "Owner",
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
            render: (status: string) => (<Tag color={PROPOSAL_STATUS_COLORS[status] ?? "default"}>{status}</Tag>),
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
    return (<div className={styles.container}>
      <Space direction="vertical" size={8}>
        <Link className={styles.backLink} href="/dashboard/clients">
          <ArrowLeftOutlined />
          Back to clients
        </Link>
        <div className={styles.header}>
          <Typography.Title className={styles.title} level={2}>
            {client.name}
          </Typography.Title>
          <Typography.Paragraph className={styles.description}>
            {isClientScoped
            ? `Review your account details, current commercial items, proposals, contracts, and account-team communication for ${client.name}.`
            : `${client.industry} account in the ${client.segment ?? "Unassigned"} segment with ${client.isActive ? "active" : "inactive"} commercial tracking.`}
          </Typography.Paragraph>
        </div>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card className={styles.cardFullHeight}>
            <Typography.Text className={styles.metricLabel}>
              {isClientScoped ? "Active commercial value" : "Open pipeline"}
            </Typography.Text>
            <Typography.Title className={styles.metricTitle} level={3}>
              {formatCurrency(isClientScoped ? activeCommercialValue : openPipelineValue)}
            </Typography.Title>
            <Typography.Text className={styles.metricLabel}>
              {isClientScoped
            ? `${activeClientOpportunities.length} active commercial item${activeClientOpportunities.length === 1 ? "" : "s"} linked to this account.`
            : `${clientOpportunities.length} opportunit${clientOpportunities.length === 1 ? "y" : "ies"} linked to this client.`}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className={styles.cardFullHeight}>
            <Typography.Text className={styles.metricLabel}>
              {isClientScoped ? "Next account milestone" : "Highest priority"}
            </Typography.Text>
            <Typography.Title className={styles.metricTitle} level={3}>
              {isClientScoped
            ? nextCommercialOpportunity?.stage ?? "No open items"
            : topPriority?.priorityBand ?? "None"}
            </Typography.Title>
            <Typography.Text className={styles.metricLabel}>
              {isClientScoped
            ? nextCommercialOpportunity
                ? `${nextCommercialOpportunity.title} is currently in ${nextCommercialOpportunity.stage} and targeted for ${nextCommercialOpportunity.expectedCloseDate}.`
                : "No active commercial items are open for this account right now."
            : topPriority
                ? `${Math.max(getDaysUntil(topPriority.opportunity.expectedCloseDate), 0)} day${Math.abs(getDaysUntil(topPriority.opportunity.expectedCloseDate)) === 1 ? "" : "s"} to close ${topPriority.opportunity.title}.`
                : "No active opportunities to rank yet."}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className={styles.cardFullHeight}>
            <Typography.Text className={styles.metricLabel}>Proposals</Typography.Text>
            <Typography.Title className={styles.metricTitle} level={3}>
              {clientProposals.length}
            </Typography.Title>
            <Typography.Text className={styles.metricLabel}>
              {clientProposals.filter((proposal) => proposal.status === "Submitted").length} awaiting review or decision.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className={styles.cardFullHeight}>
            <Typography.Text className={styles.metricLabel}>
              {isClientScoped ? "Account lead" : "Contracts"}
            </Typography.Text>
            <Typography.Title className={styles.metricTitle} level={3}>
              {isClientScoped ? accountLeadName : clientContracts.length}
            </Typography.Title>
            <Typography.Text className={styles.metricLabel}>
              {isClientScoped
            ? "Your primary commercial contact for meetings, proposals, and next steps."
            : `${clientContracts.filter((contract) => contract.status === "Active").length} active contract${clientContracts.filter((contract) => contract.status === "Active").length === 1 ? "" : "s"} on record.`}
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className={styles.cardFullHeight} title="Client details">
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
        <Col xs={24} xl={12}>
          <Card className={styles.cardFullHeight} title="Primary contact">
            {primaryContact ? (<Descriptions column={1} size="small">
                <Descriptions.Item label="Name">
                  {`${primaryContact.firstName} ${primaryContact.lastName}`.trim()}
                </Descriptions.Item>
                <Descriptions.Item label="Role">{primaryContact.position}</Descriptions.Item>
                <Descriptions.Item label="Email">
                  <a href={`mailto:${primaryContact.email}`}>{primaryContact.email}</a>
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {primaryContact.phoneNumber ? (<a href={`tel:${primaryContact.phoneNumber}`}>{primaryContact.phoneNumber}</a>) : ("Not set")}
                </Descriptions.Item>
              </Descriptions>) : (<Empty description="No contact has been linked to this client yet." image={Empty.PRESENTED_IMAGE_SIMPLE}/>)}
          </Card>
        </Col>
      </Row>

      {isClientScoped ? <ClientMessageCenter /> : null}

      <Card className={styles.card} title={`${isClientScoped ? "Commercial items" : "Priority pipeline"} (${clientOpportunities.length})`}>
        <AnimatedDashboardTable columns={opportunityColumns} dataSource={clientOpportunities} emptyDescription={isClientScoped ? "No commercial items linked to this account yet" : "No opportunities linked to this client yet"} rowKey="id"/>
      </Card>

      <Card className={styles.card} title={`Proposals (${clientProposals.length})`}>
        <AnimatedDashboardTable columns={proposalColumns} dataSource={clientProposals} emptyDescription="No proposals linked to this client yet" rowKey="id"/>
      </Card>
    </div>);
};
