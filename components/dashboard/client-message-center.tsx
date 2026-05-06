"use client";

import { CheckOutlined, MailOutlined, StopOutlined } from "@ant-design/icons";
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
import { useEffect, useMemo, useState } from "react";

import {
  isClientRequestThread,
  isTeamAssignmentThread,
} from "@/lib/dashboard/message-threads";
import {
  createServiceRequest,
  applyServiceRequestClientDecision,
  getServiceRequestDetail,
  listServiceRequests,
  type ServiceRequestAssignmentRecord,
  type ServiceRequestDetail,
  type ServiceRequestRecord,
} from "@/lib/client/service-request-api";
import { useMounted } from "@/lib/client/use-mounted";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import type { INoteItem } from "@/providers/domainSeeds";
import { useNoteState } from "@/providers/noteProvider";
import { useStyles } from "./client-message-center.styles";

type ClientMessageCenterProps = Readonly<{
  compact?: boolean;
}>;

type MessageFormValues = {
  content: string;
  subject: string;
};

const getMessageStatusColor = (status?: INoteItem["status"]) => {
  switch (status) {
    case "Accepted":
      return "green";
    case "Acknowledged":
      return "green";
    case "Pending admin review":
      return "orange";
    case "Pending client response":
      return "gold";
    case "Rejected":
      return "red";
    case "Sent":
    default:
      return "blue";
  }
};

const getMessageSourceLabel = (note: INoteItem) => {
  switch (note.source) {
    case "workspace":
      return "Account team";
    case "assistant":
      return "Advisor";
    case "client_portal":
    default:
      return "You";
  }
};

export const ClientMessageCenter = ({
  compact = false,
}: ClientMessageCenterProps) => {
  const { user } = useAuthState();
  const { clients } = useClientState();
  const { notes } = useNoteState();
  const { styles } = useStyles();
  const [messageApi, contextHolder] = message.useMessage();
  const mounted = useMounted();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestRecord[]>([]);
  const [serviceRequestDetails, setServiceRequestDetails] = useState<
    Record<string, ServiceRequestDetail>
  >({});
  const [form] = Form.useForm<MessageFormValues>();

  const primaryClientId = user?.clientIds?.[0];
  const client = clients.find((item) => item.id === primaryClientId) ?? clients[0];

  const clientMessages = useMemo<INoteItem[]>(() => {
    if (!client) {
      return [];
    }

    return notes
      .filter((note) => note.clientId === client.id)
      .sort((left, right) => right.createdDate.localeCompare(left.createdDate));
  }, [client, notes]);

  const clientServiceRequests = useMemo(
    () =>
      client
        ? serviceRequests
            .filter((request) => request.clientId === client.id)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        : [],
    [client, serviceRequests],
  );

  const assignmentProposals = useMemo(
    () =>
      clientServiceRequests.flatMap((request) => {
        const detail = serviceRequestDetails[request.id];

        if (!detail) {
          return [];
        }

        const pendingAssignments = detail.assignments.filter(
          (assignment) => assignment.status === "pending_client_approval",
        );

        if (pendingAssignments.length === 0) {
          return [];
        }

        return [
          {
            assignments: pendingAssignments,
            createdAt: pendingAssignments[0]?.createdAt ?? request.updatedAt,
            request,
          },
        ];
      }),
    [clientServiceRequests, serviceRequestDetails],
  );

  const visibleHistory = useMemo(
    () =>
      clientMessages.filter(
        (note) =>
          !isTeamAssignmentThread(note) || note.status !== "Pending client response",
      ),
    [clientMessages],
  );

  const loadServiceRequests = async () => {
    try {
      return await listServiceRequests();
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  useEffect(() => {
    let isActive = true;

    void loadServiceRequests().then((items) => {
      if (isActive) {
        setServiceRequests(items);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    if (clientServiceRequests.length === 0) {
      return () => {
        isActive = false;
      };
    }

    void Promise.all(
      clientServiceRequests.map(async (request) => [
        request.id,
        await getServiceRequestDetail(request.id),
      ] as const),
    ).then((entries) => {
      if (!isActive) {
        return;
      }

      setServiceRequestDetails(Object.fromEntries(entries));
    });

    return () => {
      isActive = false;
    };
  }, [clientServiceRequests]);

  const openComposer = () => {
    form.setFieldsValue({
      content: client ? `Hello, we would like help with ${client.name}.` : undefined,
      subject: client ? `${client.name} account request` : "Client account request",
    });
    setIsModalOpen(true);
  };

  const closeComposer = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values: MessageFormValues) => {
    if (!client) {
      messageApi.error("The client workspace is not available.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createServiceRequest({
        clientId: client.id,
        description: values.content.trim(),
        priority: "high",
        requestType: "service_request",
        source: "client_portal",
        title: values.subject.trim(),
      });
      setServiceRequests(await loadServiceRequests());
      messageApi.success("Request sent to the workspace admin for assignment.");
      closeComposer();
    } catch (error) {
      console.error(error);
      messageApi.error("Could not save the request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshServiceRequests = async () => {
    const nextRequests = await loadServiceRequests();
    setServiceRequests(nextRequests);

    const detailEntries = await Promise.all(
      nextRequests.map(async (request) => [request.id, await getServiceRequestDetail(request.id)] as const),
    );
    setServiceRequestDetails(Object.fromEntries(detailEntries));
  };

  const respondToAssignment = async (
    request: ServiceRequestRecord,
    assignments: ServiceRequestAssignmentRecord[],
    decision: "approve" | "reject",
  ) => {
    setIsSubmitting(true);

    try {
      await applyServiceRequestClientDecision(request.id, {
        assignmentIds: assignments.map((assignment) => assignment.id),
        decision,
      });
      await refreshServiceRequests();
      messageApi.success(
        decision === "approve"
          ? "The assigned sales reps were approved."
          : "The assigned sales reps were rejected.",
      );
    } catch (error) {
      console.error(error);
      messageApi.error("Could not update the assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={styles.card}>
      {mounted ? contextHolder : null}

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerCopy}>
            <Typography.Title className={styles.title} level={compact ? 4 : 3}>
              Request support from the account team
            </Typography.Title>
            <Typography.Text className={styles.mutedText}>
              Submit your request here. The workspace admin will review it, assign the
              right sales rep, and you can then accept or reject that assignment.
            </Typography.Text>
          </div>
          <Button icon={<MailOutlined />} onClick={() => openComposer()} type="primary">
            Submit request
          </Button>
        </div>

        {assignmentProposals.length > 0 ? (
          <div className={styles.list}>
            {assignmentProposals.map(({ assignments, createdAt, request }) => (
              <div className={styles.messageCard} key={request.id}>
                <div className={styles.messageHeader}>
                  <div className={styles.metaGroup}>
                    <Typography.Title className={styles.messageTitle} level={5}>
                      {assignments.map((assignment) => assignment.representativeName).join(", ")}
                    </Typography.Title>
                    <Space size="small" wrap>
                      <Tag color="gold">Pending your decision</Tag>
                      <Tag color="default">{request.title}</Tag>
                      <Tag color="geekblue">{createdAt.split("T")[0]}</Tag>
                    </Space>
                  </div>
                  <Space size="small" wrap>
                    <Button
                      icon={<CheckOutlined />}
                      loading={isSubmitting}
                      onClick={() => void respondToAssignment(request, assignments, "approve")}
                      type="primary"
                    >
                      Accept
                    </Button>
                    <Button
                      danger
                      icon={<StopOutlined />}
                      loading={isSubmitting}
                      onClick={() => void respondToAssignment(request, assignments, "reject")}
                    >
                      Reject
                    </Button>
                  </Space>
                </div>
                <Typography.Paragraph className={styles.messageText}>
                  {request.description}
                </Typography.Paragraph>
                <Typography.Text className={styles.messageFooter}>
                  Assigned by workspace admin. Waiting for your approval before the reps are asked
                  to accept.
                </Typography.Text>
              </div>
            ))}
          </div>
        ) : null}

        {visibleHistory.length === 0 ? (
          <Empty
            description="No requests have been sent from this client workspace yet."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className={styles.list}>
            {visibleHistory.slice(0, compact ? 3 : 6).map((note) => (
              <div className={styles.messageCard} key={note.id}>
                <div className={styles.messageHeader}>
                  <div className={styles.metaGroup}>
                    <Typography.Title className={styles.messageTitle} level={5}>
                      {note.title}
                    </Typography.Title>
                    <Space size="small" wrap>
                      <Tag color={note.source === "workspace" ? "gold" : "default"}>
                        {getMessageSourceLabel(note)}
                      </Tag>
                      {note.representativeName ? (
                        <Tag color="geekblue">{note.representativeName}</Tag>
                      ) : (
                        <Tag color="default">Workspace admin</Tag>
                      )}
                      <Tag color={getMessageStatusColor(note.status)}>
                        {note.status ?? "Sent"}
                      </Tag>
                      <Tag color="default">{note.createdDate}</Tag>
                    </Space>
                  </div>
                  <Button icon={<MailOutlined />} onClick={() => openComposer()}>
                    New request
                  </Button>
                </div>
                <Typography.Paragraph className={styles.messageText}>
                  {note.content}
                </Typography.Paragraph>
                <Typography.Text className={styles.messageFooter}>
                  {isClientRequestThread(note)
                    ? "Submitted for admin review."
                    : note.source === "workspace"
                      ? "Shared by your account team."
                      : note.submittedBy
                        ? `Sent from ${note.submittedBy}`
                        : "Submitted from this client workspace."}
                </Typography.Text>
              </div>
            ))}
            {clientServiceRequests.map((request) => (
              <div className={styles.messageCard} key={request.id}>
                <div className={styles.messageHeader}>
                  <div className={styles.metaGroup}>
                    <Typography.Title className={styles.messageTitle} level={5}>
                      {request.title}
                    </Typography.Title>
                    <Space size="small" wrap>
                      <Tag color="default">You</Tag>
                      <Tag color="orange">
                        {request.status === "submitted"
                          ? "Pending admin review"
                          : request.status.replace(/_/g, " ")}
                      </Tag>
                      <Tag color="default">{request.createdAt.split("T")[0]}</Tag>
                    </Space>
                  </div>
                  <Button icon={<MailOutlined />} onClick={() => openComposer()}>
                    New request
                  </Button>
                </div>
                <Typography.Paragraph className={styles.messageText}>
                  {request.description}
                </Typography.Paragraph>
                <Typography.Text className={styles.messageFooter}>
                  Submitted through the owned workflow API.
                </Typography.Text>
              </div>
            ))}
          </div>
        )}
      </div>

      {mounted ? (
        <Modal
          onCancel={closeComposer}
          onOk={() => form.submit()}
          okButtonProps={{ loading: isSubmitting }}
          okText="Send request"
          open={isModalOpen}
          title="Submit account team request"
        >
          <Form className={styles.modalForm} form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Subject"
              name="subject"
              rules={[{ message: "Please add a subject", required: true }]}
            >
              <Input placeholder="e.g. Proposal clarification" />
            </Form.Item>

            <Form.Item
              label="Message"
              name="content"
              rules={[{ message: "Please enter your message", required: true }]}
            >
              <Input.TextArea
                placeholder="Share what you need, the context, and any deadlines"
                rows={5}
              />
            </Form.Item>
          </Form>
        </Modal>
      ) : null}
    </Card>
  );
};
