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
import { useMemo, useState } from "react";

import {
  CLIENT_MESSAGE_CATEGORY,
  isClientRequestThread,
  isTeamAssignmentThread,
} from "@/lib/dashboard/message-threads";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import type { INoteItem } from "@/providers/domainSeeds";
import { useNoteActions, useNoteState } from "@/providers/noteProvider";
import { useStyles } from "./client-message-center.styles";

type ClientMessageCenterProps = Readonly<{
  compact?: boolean;
}>;

type MessageFormValues = {
  content: string;
  subject: string;
};

const createMessageId = () =>
  `client-message-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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
  const { addNote, updateNote } = useNoteActions();
  const { styles } = useStyles();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const assignmentProposals = useMemo(
    () =>
      clientMessages.filter(
        (note) =>
          isTeamAssignmentThread(note) && note.status === "Pending client response",
      ),
    [clientMessages],
  );

  const visibleHistory = useMemo(
    () =>
      clientMessages.filter(
        (note) =>
          !isTeamAssignmentThread(note) || note.status !== "Pending client response",
      ),
    [clientMessages],
  );

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
      await addNote({
        category: CLIENT_MESSAGE_CATEGORY,
        clientId: client.id,
        content: values.content.trim(),
        createdDate: new Date().toISOString().split("T")[0],
        id: createMessageId(),
        kind: "client_message",
        requestType: "client_request",
        source: "client_portal",
        status: "Pending admin review",
        submittedBy: user?.email ?? undefined,
        title: values.subject.trim(),
      });
      messageApi.success("Request sent to the workspace admin for assignment.");
      closeComposer();
    } catch (error) {
      console.error(error);
      messageApi.error("Could not save the request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const respondToAssignment = async (
    note: INoteItem,
    status: "Accepted" | "Rejected",
  ) => {
    setIsSubmitting(true);

    try {
      await updateNote(note.id, { status });
      messageApi.success(
        status === "Accepted"
          ? `${note.representativeName ?? "The sales rep"} was accepted.`
          : `${note.representativeName ?? "The sales rep"} was rejected.`,
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
      {contextHolder}

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
            {assignmentProposals.map((note) => (
              <div className={styles.messageCard} key={note.id}>
                <div className={styles.messageHeader}>
                  <div className={styles.metaGroup}>
                    <Typography.Title className={styles.messageTitle} level={5}>
                      {note.representativeName ?? "Assigned sales rep"}
                    </Typography.Title>
                    <Space size="small" wrap>
                      <Tag color="gold">Pending your decision</Tag>
                      <Tag color="geekblue">{note.createdDate}</Tag>
                    </Space>
                  </div>
                  <Space size="small" wrap>
                    <Button
                      icon={<CheckOutlined />}
                      loading={isSubmitting}
                      onClick={() => void respondToAssignment(note, "Accepted")}
                      type="primary"
                    >
                      Accept
                    </Button>
                    <Button
                      danger
                      icon={<StopOutlined />}
                      loading={isSubmitting}
                      onClick={() => void respondToAssignment(note, "Rejected")}
                    >
                      Reject
                    </Button>
                  </Space>
                </div>
                <Typography.Paragraph className={styles.messageText}>
                  {note.content}
                </Typography.Paragraph>
                <Typography.Text className={styles.messageFooter}>
                  Assigned by {note.assignedByUserName ?? "workspace admin"}.
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
          </div>
        )}
      </div>

      <Modal
        forceRender
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
    </Card>
  );
};
