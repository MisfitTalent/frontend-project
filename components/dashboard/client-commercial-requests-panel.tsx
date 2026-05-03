"use client";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Form, Input, Modal, Select, Space, Tag, Typography, message } from "antd";
import { useMemo, useState } from "react";
import { AnimatedDashboardTable } from "./animated-dashboard-table";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import { useDashboardState } from "@/providers/dashboardProvider";
import { PRICING_REQUEST_STATUS_COLORS, type IPricingRequest } from "@/providers/salesTypes";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { usePricingRequestActions, usePricingRequestState, } from "@/providers/pricingRequestProvider";
import { useStyles } from "./client-commercial-requests-panel.styles";
type ClientCommercialRequestsPanelProps = Readonly<{
    compact?: boolean;
}>;
type CommercialRequestFormValues = {
    details?: string;
    opportunityId: string;
    preferredRepId?: string;
    priority: number;
    requestType: string;
    requiredByDate?: string;
    title: string;
};
const REQUEST_TYPES = [
    "New quote",
    "Pricing clarification",
    "Scope change",
    "Renewal question",
];
const PRIORITY_OPTIONS = [
    { label: "Urgent", value: 1 },
    { label: "High", value: 2 },
    { label: "Normal", value: 3 },
    { label: "Low", value: 4 },
];
const clientFacingRole = (role: string) => ["Account Executive", "Sales Consultant", "Client Success", "Business Development", "Pipeline Director"].some((token) => role.includes(token));
const createRequestId = () => `client-request-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const createRequestNumber = () => `CR-${String(Date.now()).slice(-6)}`;
const getPriorityLabel = (priority: number) => PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? "Priority";
const getClientRequestStatusLabel = (status: string) => {
    switch (status) {
        case "Assigned":
        case "In Progress":
            return "In review";
        case "Completed":
            return "Resolved";
        case "Cancelled":
            return "Closed";
        case "Pending":
        default:
            return "Submitted";
    }
};
export const ClientCommercialRequestsPanel = ({ compact = false, }: ClientCommercialRequestsPanelProps) => {
    const { user } = useAuthState();
    const { clients } = useClientState();
    const { opportunities } = useOpportunityState();
    const { pricingRequests } = usePricingRequestState();
    const { addPricingRequest } = usePricingRequestActions();
    const { teamMembers } = useDashboardState();
    const { styles } = useStyles();
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form] = Form.useForm<CommercialRequestFormValues>();
    const primaryClientId = user?.clientIds?.[0];
    const client = clients.find((item) => item.id === primaryClientId) ?? clients[0];
    const clientOpportunities = useMemo(() => opportunities.filter((opportunity) => client ? opportunity.clientId === client.id : false), [client, opportunities]);
    const representativeOptions = useMemo(() => teamMembers
        .filter((member) => clientFacingRole(member.role))
        .map((member) => ({
        label: member.name,
        value: member.id,
    }))
        .sort((left, right) => left.label.localeCompare(right.label)), [teamMembers]);
    const requestRows = useMemo(() => pricingRequests
        .filter((request) => clientOpportunities.some((opportunity) => opportunity.id === request.opportunityId))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)), [clientOpportunities, pricingRequests]);
    const requestSummary = useMemo(() => {
        const submitted = requestRows.filter((request) => request.status === "Pending").length;
        const inReview = requestRows.filter((request) => ["Assigned", "In Progress"].includes(request.status)).length;
        const resolved = requestRows.filter((request) => request.status === "Completed").length;
        return { inReview, resolved, submitted };
    }, [requestRows]);
    const openRequestModal = () => {
        form.setFieldsValue({
            opportunityId: clientOpportunities[0]?.id,
            priority: 2,
            requestType: REQUEST_TYPES[0],
            requiredByDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5)
                .toISOString()
                .split("T")[0],
            title: client ? `${client.name} pricing request` : "Commercial request",
        });
        setIsModalOpen(true);
    };
    const closeRequestModal = () => {
        setIsModalOpen(false);
        form.resetFields();
    };
    const handleSubmit = async (values: CommercialRequestFormValues) => {
        const opportunity = clientOpportunities.find((item) => item.id === values.opportunityId);
        if (!opportunity) {
            messageApi.error("Please choose the related commercial item.");
            return;
        }
        setIsSubmitting(true);
        try {
            const preferredRepresentative = representativeOptions.find((option) => option.value === values.preferredRepId);
            const request: IPricingRequest = {
                assignedToId: values.preferredRepId,
                assignedToName: preferredRepresentative?.label,
                createdAt: new Date().toISOString(),
                description: [
                    `Request type: ${values.requestType}.`,
                    values.details?.trim(),
                    user?.email ? `Submitted by ${user.email}.` : undefined,
                ]
                    .filter(Boolean)
                    .join("\n\n"),
                id: createRequestId(),
                opportunityId: opportunity.id,
                opportunityTitle: opportunity.name || opportunity.title,
                priority: values.priority,
                priorityLabel: getPriorityLabel(values.priority),
                requestNumber: createRequestNumber(),
                requiredByDate: values.requiredByDate,
                requestedByName: client?.name,
                status: "Pending",
                title: values.title.trim(),
            };
            await addPricingRequest(request);
            messageApi.success("Commercial request submitted.");
            closeRequestModal();
        }
        catch (error) {
            console.error(error);
            messageApi.error(error instanceof Error ? error.message : "Could not submit the request.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<Card className={styles.card}>
      {contextHolder}

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerCopy}>
            <Typography.Title className={styles.title} level={compact ? 4 : 3}>
            Commercial requests
            </Typography.Title>
            <Typography.Text className={styles.mutedText}>
            Ask for a new quote, pricing clarification, or commercial review without leaving the client portal.
            </Typography.Text>
          </div>
          <Button disabled={clientOpportunities.length === 0} icon={<PlusOutlined />} onClick={openRequestModal} type="primary">
            Request help
          </Button>
        </div>

        {clientOpportunities.length === 0 ? (<Empty description="A commercial item needs to exist before you can submit a quote or pricing request." image={Empty.PRESENTED_IMAGE_SIMPLE}/>) : (<div className={styles.container}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <Typography.Text className={styles.mutedText}>Submitted</Typography.Text>
                <Typography.Title className={styles.title} level={4}>
                  {requestSummary.submitted}
                </Typography.Title>
                <Typography.Text className={styles.mutedText}>
                  Requests waiting for the account team to pick up.
                </Typography.Text>
              </div>
              <div className={styles.summaryCard}>
                <Typography.Text className={styles.mutedText}>In review</Typography.Text>
                <Typography.Title className={styles.title} level={4}>
                  {requestSummary.inReview}
                </Typography.Title>
                <Typography.Text className={styles.mutedText}>
                  Requests that are already with a representative.
                </Typography.Text>
              </div>
              <div className={styles.summaryCard}>
                <Typography.Text className={styles.mutedText}>Resolved</Typography.Text>
                <Typography.Title className={styles.title} level={4}>
                  {requestSummary.resolved}
                </Typography.Title>
                <Typography.Text className={styles.mutedText}>
                  Commercial requests completed for this account.
                </Typography.Text>
              </div>
            </div>

            {compact ? (requestRows.length === 0 ? (<Empty description="No commercial requests have been submitted from this account yet." image={Empty.PRESENTED_IMAGE_SIMPLE}/>) : (<div className={styles.list}>
                {requestRows.slice(0, 3).map((request) => (<div className={styles.itemCard} key={request.id}>
                    <div className={styles.itemHeader}>
                      <div className={styles.headerCopy}>
                        <Typography.Title className={styles.itemTitle} level={5}>
                            {request.title}
                        </Typography.Title>
                        <Typography.Text className={styles.mutedText}>
                            {request.opportunityTitle ?? "Commercial item"}
                        </Typography.Text>
                      </div>
                      <Space size="small" wrap>
                        <Tag color={PRICING_REQUEST_STATUS_COLORS[request.status] ?? "default"}>
                            {getClientRequestStatusLabel(request.status)}
                        </Tag>
                        <Tag color="default">
                            {request.priorityLabel ?? getPriorityLabel(request.priority)}
                        </Tag>
                      </Space>
                    </div>
                    <Typography.Paragraph className={styles.detailsText}>
                        {request.description ?? "No extra detail provided yet."}
                    </Typography.Paragraph>
                    <Typography.Text className={styles.itemFooter}>
                        {request.assignedToName
                        ? `Representative: ${request.assignedToName}`
                        : "Representative will be assigned after review."}
                    </Typography.Text>
                  </div>))}
              </div>)) : (<AnimatedDashboardTable columns={[
                    {
                        dataIndex: "title",
                        key: "title",
                        title: "Request",
                    },
                    {
                        dataIndex: "opportunityTitle",
                        key: "opportunityTitle",
                        title: "Commercial item",
                    },
                    {
                        key: "assignedToName",
                        render: (_: unknown, record: IPricingRequest) => record.assignedToName ?? "Representative not assigned yet",
                        title: "Representative",
                    },
                    {
                        key: "priority",
                        render: (_: unknown, record: IPricingRequest) => record.priorityLabel ?? getPriorityLabel(record.priority),
                        title: "Urgency",
                    },
                    {
                        dataIndex: "status",
                        key: "status",
                        render: (status: string) => (<Tag color={PRICING_REQUEST_STATUS_COLORS[status] ?? "default"}>
                        {getClientRequestStatusLabel(status)}
                      </Tag>),
                        title: "Status",
                    },
                    {
                        dataIndex: "requiredByDate",
                        key: "requiredByDate",
                        render: (value?: string) => value ?? "Not set",
                        title: "Needed by",
                    },
                    {
                        key: "createdAt",
                        render: (_: unknown, record: IPricingRequest) => record.createdAt.split("T")[0],
                        title: "Submitted",
                    },
                ]} dataSource={requestRows} emptyDescription="No commercial requests yet" isBusy={isSubmitting} rowKey="id"/>)}
          </div>)}
      </div>

      <Modal forceRender onCancel={closeRequestModal} onOk={() => form.submit()} okButtonProps={{ loading: isSubmitting }} okText="Submit request" open={isModalOpen} title="Request commercial help">
        <Form className={styles.modalForm} form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Commercial item" name="opportunityId" rules={[{ message: "Please choose a commercial item", required: true }]}>
            <Select options={clientOpportunities.map((opportunity) => ({
            label: opportunity.name || opportunity.title,
            value: opportunity.id,
        }))} placeholder="Choose the relevant commercial item"/>
          </Form.Item>

          <Form.Item label="Request type" name="requestType" rules={[{ message: "Please choose a request type", required: true }]}>
            <Select options={REQUEST_TYPES.map((requestType) => ({
            label: requestType,
            value: requestType,
        }))}/>
          </Form.Item>

          <Form.Item label="Title" name="title" rules={[{ message: "Please add a title", required: true }]}>
            <Input placeholder="e.g. Updated quote for rollout phase two"/>
          </Form.Item>

          <Form.Item label="Details" name="details">
            <Input.TextArea placeholder="Tell the team what you need clarified or priced" rows={4}/>
          </Form.Item>

          <div className={styles.twoColumnFields}>
            <Form.Item label="Urgency" name="priority" rules={[{ message: "Please choose an urgency", required: true }]}>
              <Select options={PRIORITY_OPTIONS}/>
            </Form.Item>

            <Form.Item label="Needed by" name="requiredByDate">
              <Input type="date"/>
            </Form.Item>

            <Form.Item label="Preferred representative" name="preferredRepId">
              <Select allowClear options={representativeOptions} placeholder="Choose a representative"/>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Card>);
};
