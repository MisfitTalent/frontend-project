"use client";

import { MailOutlined, SendOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addServiceRequestMessage,
  applyServiceRequestClientDecision,
  createServiceRequest,
  getServiceRequestDetail,
  listServiceRequests,
  type ServiceRequestDetail,
  type ServiceRequestRecord,
} from "@/lib/client/service-request-api";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import { useStyles } from "./client-message-center.styles";

type ClientMessageCenterProps = Readonly<{
  compact?: boolean;
}>;

type MessageFormValues = {
  content: string;
  subject: string;
};

const getStatusColor = (status: ServiceRequestRecord["status"]) => {
  switch (status) {
    case "submitted":
      return "blue";
    case "under_review":
      return "gold";
    case "proposal_prepared":
      return "cyan";
    case "awaiting_client_assignment_approval":
    case "awaiting_rep_acceptance":
      return "orange";
    case "client_approved_assignment":
    case "active":
      return "green";
    case "client_rejected_assignment":
    case "rep_rejected_assignment":
    case "cancelled":
      return "red";
    case "closed":
      return "default";
    default:
      return "blue";
  }
};

const formatStatusLabel = (status: ServiceRequestRecord["status"]) =>
  status.replace(/_/g, " ");

const formatEventSummary = (detail: ServiceRequestDetail | undefined) => {
  const latestEvent = detail?.events[0];

  if (!latestEvent) {
    return null;
  }

  if (latestEvent.eventType === "service_request_message_added") {
    const content = String(latestEvent.payloadJson.content ?? "").trim();

    return content || "A new message was added to this request.";
  }

  if (latestEvent.eventType === "service_request_assignments_created") {
    return "Your request was assigned for client review.";
  }

  if (latestEvent.eventType === "service_request_client_decision") {
    return "A client assignment decision was recorded.";
  }

  if (latestEvent.eventType === "service_request_representative_decision") {
    return "A representative responded to this request.";
  }

  if (latestEvent.eventType === "service_request_review_started") {
    return "Your request is now under review.";
  }

  return null;
};

export const ClientMessageCenter = ({
  compact = false,
}: ClientMessageCenterProps) => {
  const { user } = useAuthState();
  const { clients } = useClientState();
  const { styles } = useStyles();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestRecord[]>([]);
  const [serviceRequestDetailsById, setServiceRequestDetailsById] = useState<
    Record<string, ServiceRequestDetail>
  >({});
  const [activeRequest, setActiveRequest] = useState<ServiceRequestRecord | null>(null);
  const [form] = Form.useForm<MessageFormValues>();

  const primaryClientId = user?.clientIds?.[0];
  const client = clients.find((item) => item.id === primaryClientId) ?? clients[0];

  const loadServiceRequests = useCallback(async () => {
    const requests = await listServiceRequests();
    const scopedRequests = requests
      .filter((request) => request.clientId === client?.id)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    setServiceRequests(scopedRequests);

    const details = await Promise.all(
      scopedRequests.map(async (request) => [request.id, await getServiceRequestDetail(request.id)] as const),
    );
    setServiceRequestDetailsById(Object.fromEntries(details));
  }, [client?.id]);

  useEffect(() => {
    if (!client?.id) {
      setServiceRequests([]);
      setServiceRequestDetailsById({});
      return;
    }

    let isActive = true;

    void loadServiceRequests().catch((error) => {
      console.error(error);

      if (isActive) {
        setServiceRequests([]);
        setServiceRequestDetailsById({});
      }
    });

    return () => {
      isActive = false;
    };
  }, [client?.id, loadServiceRequests]);

  const requestThreads = useMemo(
    () => serviceRequests.slice(0, compact ? 3 : 6),
    [compact, serviceRequests],
  );

  const openComposer = (request?: ServiceRequestRecord) => {
    form.setFieldsValue({
      content: request ? "" : client ? `Hello, we need help with ${client.name}.` : "",
      subject: request?.title ?? (client ? `${client.name} account request` : "Client account request"),
    });
    setActiveRequest(request ?? null);
    setIsModalOpen(true);
  };

  const closeComposer = () => {
    setIsModalOpen(false);
    setActiveRequest(null);
    form.resetFields();
  };

  const handleSubmit = async (values: MessageFormValues) => {
    if (!client) {
      messageApi.error("No client workspace is linked to this account.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeRequest) {
        const assignedRepresentativeUserIds =
          serviceRequestDetailsById[activeRequest.id]?.assignments.map(
            (assignment) => assignment.representativeUserId,
          ) ?? [];

        await addServiceRequestMessage(activeRequest.id, {
          content: values.content.trim(),
          recipientType: "representative",
          representativeUserIds: assignedRepresentativeUserIds,
        });
        messageApi.success("Follow-up added to the request.");
      } else {
        await createServiceRequest({
          clientId: client.id,
          description: values.content.trim(),
          requestType: "service_request",
          source: "client_portal",
          title: values.subject.trim(),
        });
        messageApi.success("Request submitted to the workspace.");
      }

      await loadServiceRequests();
      closeComposer();
    } catch (error) {
      console.error(error);
      messageApi.error(
        activeRequest ? "Could not save the request follow-up." : "Could not submit the request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignmentDecision = async (
    request: ServiceRequestRecord,
    decision: "approve" | "reject",
  ) => {
    const detail = serviceRequestDetailsById[request.id];
    const assignmentIds =
      detail?.assignments
        .filter((assignment) => assignment.status === "pending_client_approval")
        .map((assignment) => assignment.id) ?? [];

    if (assignmentIds.length === 0) {
      messageApi.error("There are no pending assignments to review for this request.");
      return;
    }

    setIsSubmitting(true);

    try {
      await applyServiceRequestClientDecision(request.id, {
        assignmentIds,
        decision,
      });
      await loadServiceRequests();
      messageApi.success(
        decision === "approve"
          ? "Assignment approved. The representatives can respond next."
          : "Assignment rejected. The workspace can prepare a new assignment.",
      );
    } catch (error) {
      console.error(error);
      messageApi.error("Could not apply the assignment decision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={styles.card}>
      {contextHolder}

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerCopy}>
            <Typography.Title className={styles.title} level={compact ? 4 : 3}>
              Message your account team
            </Typography.Title>
            <Typography.Text className={styles.mutedText}>
              Create real support requests and keep follow-ups attached to the same workflow thread.
            </Typography.Text>
          </div>
          <Button icon={<MailOutlined />} onClick={() => openComposer()} type="primary">
            New request
          </Button>
        </div>

        {requestThreads.length === 0 ? (
          <Empty
            description="No support requests have been submitted from this client workspace yet."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className={styles.list}>
            {requestThreads.map((request) => {
              const detail = serviceRequestDetailsById[request.id];
              const latestSummary = formatEventSummary(detail);
              const pendingClientAssignments =
                detail?.assignments.filter(
                  (assignment) => assignment.status === "pending_client_approval",
                ) ?? [];

              return (
                <div className={styles.messageCard} key={request.id}>
                  <div className={styles.messageHeader}>
                    <div className={styles.metaGroup}>
                      <Typography.Title className={styles.messageTitle} level={5}>
                        {request.title}
                      </Typography.Title>
                      <Space size="small" wrap>
                        <Tag color={getStatusColor(request.status)}>
                          {formatStatusLabel(request.status)}
                        </Tag>
                        <Tag color="default">{request.updatedAt.split("T")[0]}</Tag>
                        {pendingClientAssignments.length > 0 ? (
                          <Tag color="orange">Waiting for your decision</Tag>
                        ) : null}
                      </Space>
                    </div>
                    <Space size="small" wrap>
                      {pendingClientAssignments.length > 0 ? (
                        <>
                          <Button
                            loading={isSubmitting}
                            onClick={() => void handleAssignmentDecision(request, "approve")}
                            type="primary"
                          >
                            Accept assignment
                          </Button>
                          <Button
                            danger
                            loading={isSubmitting}
                            onClick={() => void handleAssignmentDecision(request, "reject")}
                          >
                            Reject assignment
                          </Button>
                        </>
                      ) : null}
                      <Button
                        icon={<SendOutlined />}
                        onClick={() => openComposer(request)}
                      >
                        Follow up
                      </Button>
                    </Space>
                  </div>
                  <Typography.Paragraph className={styles.messageText}>
                    {latestSummary ?? request.description}
                  </Typography.Paragraph>
                  <Typography.Text className={styles.messageFooter}>
                    {pendingClientAssignments.length > 0
                      ? `Assigned reps: ${pendingClientAssignments.map((assignment) => assignment.representativeName).join(", ")}.`
                      : detail?.events.length
                        ? `${detail.events.length} workflow update${detail.events.length === 1 ? "" : "s"} recorded.`
                        : "Awaiting the first workflow update."}
                  </Typography.Text>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        forceRender
        onCancel={closeComposer}
        onOk={() => form.submit()}
        okButtonProps={{ loading: isSubmitting }}
        okText={activeRequest ? "Send follow-up" : "Submit request"}
        open={isModalOpen}
        title={activeRequest ? "Follow up on request" : "Create support request"}
      >
        <Form className={styles.modalForm} form={form} layout="vertical" onFinish={handleSubmit}>
          {activeRequest ? null : (
            <Form.Item
              label="Subject"
              name="subject"
              rules={[{ message: "Please add a subject", required: true }]}
            >
              <Input placeholder="e.g. Proposal clarification" />
            </Form.Item>
          )}

          <Form.Item
            label={activeRequest ? "Follow-up message" : "Request details"}
            name="content"
            rules={[{ message: "Please enter your message", required: true }]}
          >
            <Input.TextArea placeholder="Share what you need help with" rows={5} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
