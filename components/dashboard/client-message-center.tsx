"use client";

import { MailOutlined, SendOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { useMemo, useState } from "react";

import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import { useDashboardState } from "@/providers/dashboardProvider";
import type { INoteItem } from "@/providers/domainSeeds";
import { useNoteActions, useNoteState } from "@/providers/noteProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { useStyles } from "./client-message-center.styles";

type ClientMessageCenterProps = Readonly<{
  compact?: boolean;
}>;

type MessageFormValues = {
  content: string;
  representativeId: string;
  subject: string;
};

const CLIENT_MESSAGE_CATEGORY = "Client Message";
const LEGACY_CLIENT_MESSAGE_PREFIX = `${CLIENT_MESSAGE_CATEGORY} `;

const clientFacingRole = (role: string) =>
  [
    "Account Executive",
    "Sales Consultant",
    "Client Success",
    "Business Development",
    "Pipeline Director",
  ].some((token) => role.includes(token));

const createMessageId = () =>
  `client-message-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const isClientMessage = (note: INoteItem) =>
  note.kind === "client_message" ||
  note.category === CLIENT_MESSAGE_CATEGORY ||
  note.category?.startsWith(LEGACY_CLIENT_MESSAGE_PREFIX);

const getRepresentativeName = (note: INoteItem) => {
  if (note.representativeName) {
    return note.representativeName;
  }

  if (note.category?.startsWith(LEGACY_CLIENT_MESSAGE_PREFIX)) {
    return note.category
      .slice(LEGACY_CLIENT_MESSAGE_PREFIX.length)
      .replace(/^[-\u2022]\s*/, "");
  }

  return "Account team";
};

const getMessageStatusColor = (status?: INoteItem["status"]) => {
  switch (status) {
    case "Acknowledged":
      return "green";
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
  const { addNote } = useNoteActions();
  const { opportunities } = useOpportunityState();
  const { teamMembers } = useDashboardState();
  const { styles } = useStyles();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm<MessageFormValues>();

  const primaryClientId = user?.clientIds?.[0];
  const client = clients.find((item) => item.id === primaryClientId) ?? clients[0];

  const representativeOptions = useMemo(() => {
    if (!client) {
      return [];
    }

    const accountLeadIds = new Set(
      opportunities
        .filter((opportunity) => opportunity.clientId === client.id && opportunity.ownerId)
        .map((opportunity) => opportunity.ownerId as string),
    );

    return teamMembers
      .filter((member) => clientFacingRole(member.role))
      .map((member) => ({
        id: member.id,
        isAccountLead: accountLeadIds.has(member.id),
        label: `${member.name}${accountLeadIds.has(member.id) ? " (Account lead)" : ""}`,
        name: member.name,
        score: (accountLeadIds.has(member.id) ? 100 : 0) + member.availabilityPercent,
      }))
      .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
  }, [client, opportunities, teamMembers]);

  const clientMessages = useMemo<INoteItem[]>(() => {
    if (!client) {
      return [];
    }

    return notes
      .filter((note) => note.clientId === client.id && isClientMessage(note))
      .sort((left, right) => right.createdDate.localeCompare(left.createdDate));
  }, [client, notes]);

  const openComposer = (representativeId?: string) => {
    form.setFieldsValue({
      content: client ? `Hello, we would like help with ${client.name}.` : undefined,
      representativeId: representativeId ?? representativeOptions[0]?.id ?? "",
      subject: client ? `${client.name} account request` : "Client account request",
    });
    setIsModalOpen(true);
  };

  const closeComposer = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values: MessageFormValues) => {
    const representative = representativeOptions.find(
      (option) => option.id === values.representativeId,
    );

    if (!representative || !client) {
      messageApi.error("Please choose a representative before sending the message.");
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
        representativeId: representative.id,
        representativeName: representative.name,
        source: "client_portal",
        status: "Sent",
        submittedBy: user?.email ?? undefined,
        title: values.subject.trim(),
      });
      messageApi.success(`Message sent to ${representative.name}.`);
      closeComposer();
    } catch (error) {
      console.error(error);
      messageApi.error("Could not save the message.");
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
              Send account questions and commercial follow-ups to the representative
              supporting your workspace.
            </Typography.Text>
          </div>
          <Button icon={<MailOutlined />} onClick={() => openComposer()} type="primary">
            Message a representative
          </Button>
        </div>

        {clientMessages.length === 0 ? (
          <Empty
            description="No messages have been sent from this client workspace yet."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className={styles.list}>
            {clientMessages.slice(0, compact ? 3 : 6).map((note) => (
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
                      <Tag color="geekblue">{getRepresentativeName(note)}</Tag>
                      <Tag color={getMessageStatusColor(note.status)}>
                        {note.status ?? "Sent"}
                      </Tag>
                      <Tag color="default">{note.createdDate}</Tag>
                    </Space>
                  </div>
                  <Button
                    icon={<SendOutlined />}
                    onClick={() =>
                      openComposer(
                        representativeOptions.find(
                          (option) =>
                            option.id === note.representativeId ||
                            option.name === getRepresentativeName(note),
                        )?.id,
                      )
                    }
                  >
                    Follow up
                  </Button>
                </div>
                <Typography.Paragraph className={styles.messageText}>
                  {note.content}
                </Typography.Paragraph>
                <Typography.Text className={styles.messageFooter}>
                  {note.source === "workspace"
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
        okText="Send message"
        open={isModalOpen}
        title="Message a representative"
      >
        <Form className={styles.modalForm} form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Representative"
            name="representativeId"
            rules={[{ message: "Please choose a representative", required: true }]}
          >
            <Select
              options={representativeOptions.map((option) => ({
                label: option.label,
                value: option.id,
              }))}
              placeholder="Choose a representative"
            />
          </Form.Item>

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
            <Input.TextArea placeholder="Share what you need help with" rows={5} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
