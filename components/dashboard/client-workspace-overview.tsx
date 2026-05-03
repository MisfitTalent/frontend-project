"use client";
import { FileTextOutlined, FolderOpenOutlined, ArrowRightOutlined, CalendarOutlined } from "@ant-design/icons";
import { Button, Card, Col, Descriptions, Empty, Row, Space, Table, Tag, Typography } from "antd";
import Link from "next/link";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import { useContactState } from "@/providers/contactProvider";
import { useContractState } from "@/providers/contractProvider";
import { useDocumentState } from "@/providers/documentProvider";
import { formatCurrency } from "@/providers/salesSelectors";
import { PROPOSAL_STATUS_COLORS } from "@/providers/salesTypes";
import { useProposalState } from "@/providers/proposalProvider";
import { ClientCommercialRequestsPanel } from "./client-commercial-requests-panel";
import { ClientMessageCenter } from "./client-message-center";
import { ClientRepresentativesPanel } from "./client-representatives-panel";
import { useStyles } from "./client-workspace-overview.styles";
export const ClientWorkspaceOverview = () => {
    const { user } = useAuthState();
    const { clients } = useClientState();
    const { contacts } = useContactState();
    const { contracts } = useContractState();
    const { documents } = useDocumentState();
    const { proposals } = useProposalState();
    const { styles } = useStyles();
    const primaryClientId = user?.clientIds?.[0];
    const client = clients.find((item) => item.id === primaryClientId) ?? clients[0];
    if (!client) {
        return (<Card className={styles.card}>
        <Empty description="This client workspace is not linked to an account yet." image={Empty.PRESENTED_IMAGE_SIMPLE}/>
      </Card>);
    }
    const clientContacts = contacts.filter((contact) => contact.clientId === client.id);
    const primaryContact = clientContacts.find((contact) => contact.isPrimaryContact) ?? clientContacts[0];
    const clientProposals = proposals
        .filter((proposal) => proposal.clientId === client.id)
        .sort((left, right) => right.validUntil.localeCompare(left.validUntil));
    const clientContracts = contracts.filter((contract) => contract.clientId === client.id);
    const clientDocuments = documents
        .filter((document) => !document.clientId || document.clientId === client.id)
        .sort((left, right) => right.uploadedDate.localeCompare(left.uploadedDate));
    const submittedProposals = clientProposals.filter((proposal) => proposal.status === "Submitted");
    const activeContracts = clientContracts.filter((contract) => contract.status === "Active");
    return (<div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroBody}>
          <div className={styles.heroHeader}>
            <span className={styles.heroEyebrow}>
              Client workspace preview
            </span>
            <h2 className={styles.heroTitle}>
              Welcome to {client.name}
            </h2>
            <p className={styles.heroDescription}>
              Review your commercial documents, keep track of proposal status, and stay aligned on the latest account information without exposing the internal sales workspace.
            </p>
          </div>

          <Space className={styles.heroActions} size="middle" wrap>
            <Link href={`/dashboard/clients/${client.id}`}>
              <Button className={styles.heroPrimaryButton} icon={<ArrowRightOutlined />}>
                Open account overview
              </Button>
            </Link>
            <Link href="/dashboard/proposals">
              <Button className={styles.ctaButton} icon={<FileTextOutlined />}>
                View proposals
              </Button>
            </Link>
            <Link href="/dashboard/documents">
              <Button className={styles.ctaButton} icon={<FolderOpenOutlined />}>
                View documents
              </Button>
            </Link>
            <Link href="/dashboard/activities">
              <Button className={styles.ctaButton} icon={<CalendarOutlined />}>
                View meetings
              </Button>
            </Link>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card className={styles.cardFullHeight}>
            <Typography.Text className={styles.metricLabel}>Submitted proposals</Typography.Text>
            <Typography.Title className={styles.metricTitle} level={3}>
              {submittedProposals.length}
            </Typography.Title>
            <Typography.Text className={styles.metricText}>
              Proposal{submittedProposals.length === 1 ? "" : "s"} currently awaiting review or decision.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className={styles.cardFullHeight}>
            <Typography.Text className={styles.metricLabel}>Shared documents</Typography.Text>
            <Typography.Title className={styles.metricTitle} level={3}>
              {clientDocuments.length}
            </Typography.Title>
            <Typography.Text className={styles.metricText}>
              Files currently visible to this account workspace.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className={styles.cardFullHeight}>
            <Typography.Text className={styles.metricLabel}>Active contracts</Typography.Text>
            <Typography.Title className={styles.metricTitle} level={3}>
              {activeContracts.length}
            </Typography.Title>
            <Typography.Text className={styles.metricText}>
              {activeContracts.length === 0
            ? "No active contracts on file yet."
            : "Commercial agreements currently active for this account."}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className={styles.cardFullHeight}>
            <Typography.Text className={styles.metricLabel}>Primary contact</Typography.Text>
            <Typography.Title className={styles.metricTitle} level={3}>
              {primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : "Not set"}
            </Typography.Title>
            <Typography.Text className={styles.metricText}>
              {primaryContact?.position ?? "No primary contact assigned yet."}
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <Card className={styles.cardFullHeight} title="Account snapshot">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Account name">{client.name}</Descriptions.Item>
              <Descriptions.Item label="Industry">{client.industry}</Descriptions.Item>
              <Descriptions.Item label="Segment">{client.segment ?? "Not set"}</Descriptions.Item>
              <Descriptions.Item label="Website">{client.website ?? "Not set"}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={client.isActive ? "green" : "red"}>
                  {client.isActive ? "Active" : "Inactive"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Primary contact email">
                {primaryContact ? (<a href={`mailto:${primaryContact.email}`}>{primaryContact.email}</a>) : ("Not set")}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card className={styles.cardFullHeight} title="Recent proposals">
            <Table columns={[
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
                dataIndex: "value",
                key: "value",
                render: (value: number) => formatCurrency(value ?? 0),
                title: "Value",
            },
            {
                dataIndex: "validUntil",
                key: "validUntil",
                title: "Valid until",
            },
        ]} dataSource={clientProposals.slice(0, 5)} locale={{ emptyText: "No proposals have been shared with this account yet." }} pagination={false} rowKey="id"/>
          </Card>
        </Col>
      </Row>

      <ClientRepresentativesPanel compact/>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <ClientCommercialRequestsPanel compact/>
        </Col>
        <Col xs={24} xl={12}>
          <ClientMessageCenter compact/>
        </Col>
      </Row>

      <Card className={styles.card} title="Shared documents">
        <Table columns={[
            {
                dataIndex: "name",
                key: "name",
                title: "Document",
            },
            {
                dataIndex: "type",
                key: "type",
                render: (type: string) => <Tag color="geekblue">{type}</Tag>,
                title: "Type",
            },
            {
                dataIndex: "uploadedDate",
                key: "uploadedDate",
                title: "Uploaded",
            },
        ]} dataSource={clientDocuments.slice(0, 5)} locale={{ emptyText: "No documents have been shared with this account yet." }} pagination={false} rowKey="id"/>
      </Card>
    </div>);
};
